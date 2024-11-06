#include "platform_load_time_gen.hpp"
#include <algorithm>
#include <iostream>
#include <mpi.h>
#include <queue>
#include <string>
#include <unordered_map>
#include <vector>

using std::string;
using std::vector;

#define MAX_BUFFER_SIZE 256

struct Train {
  size_t id;
  char line;
  string current_station;
  string next_station;
  enum State { IN_LINK, AT_PLATFORM, IN_HOLDING } state;
  size_t ticks_remaining;
  size_t arrival_time;
};

struct Platform {
  string next_station;
  size_t train_id = -1;
  std::priority_queue<std::pair<size_t, size_t>,
                      vector<std::pair<size_t, size_t>>,
                      std::greater<>>
      holding_queue; // (arrival_time, train_id)
  PlatformLoadTimeGen load_gen;

  Platform(size_t popularity) : load_gen(popularity) {}
};

struct Link {
  string from_station;
  string to_station;
  size_t distance;
  size_t train_id = -1;
};

struct TrainStateUpdate {
    size_t train_id;
    Train::State new_state;
    size_t ticks_remaining;
    char current_station[32];
};

class MRTSimulation {
private:
  // Basic simulation parameters
  const size_t num_stations;
  const vector<string> &station_names;
  const vector<size_t> &popularities;
  const vector<vector<size_t>> &matrix;
  const std::unordered_map<char, vector<string>> &station_lines;
  const size_t total_ticks;
  const std::unordered_map<char, size_t> &trains_per_line;

  // MPI parameters
  const int rank;
  const int total_processes;

  // Simulation state
  vector<Train> trains;
  std::unordered_map<string, vector<Platform>> platforms;
  vector<Link> links;
  vector<size_t> my_stations;
  bool manages_station(const string &station) const {
    size_t station_idx = get_station_index(station);
    return std::find(my_stations.begin(), my_stations.end(), station_idx) !=
           my_stations.end();
  }

  size_t get_station_index(const string &station) const {
    for (size_t i = 0; i < station_names.size(); i++) {
      if (station_names[i] == station)
        return i;
    }
    return -1;
  }
  void initialize_network() {
    // Set up platforms and links
    for (size_t i = 0; i < num_stations; i++) {
      const string &station = station_names[i];
      platforms[station] = vector<Platform>();

      for (size_t j = 0; j < num_stations; j++) {
        if (matrix[i][j] > 0) {
          platforms[station].emplace_back(popularities[i]);
          platforms[station].back().next_station = station_names[j];

          links.push_back({station, station_names[j], matrix[i][j]});
        }
      }

      // Distribute stations to processes (skip rank 0)
      if (rank > 0 && (i % (total_processes - 1) == (rank - 1))) {
        my_stations.push_back(i);
        if (rank == 1) { // Debug output for first worker
          std::cout << "Process " << rank << " assigned station: " 
                    << station_names[i] << std::endl;
        }
      }
    }
  }

  void spawn_trains(size_t tick) {
    if (rank != 0)
      return;

    std::unordered_map<char, size_t> spawned;
    for (const auto &train : trains) {
      spawned[train.line]++;
    }

    const vector<char> line_order = {'g', 'y', 'b'};
    for (char line : line_order) {
      if (spawned[line] >= trains_per_line.at(line))
        continue;

      const auto &line_stations = station_lines.at(line);
      vector<string> terminals = {line_stations.front(), line_stations.back()};

      for (const string &terminal : terminals) {
        if (spawned[line] >= trains_per_line.at(line))
          break;

        Train train;
        train.id = trains.size();
        train.line = line;
        train.current_station = terminal;
        train.next_station = (terminal == line_stations.front())
                                 ? line_stations[1]
                                 : line_stations[line_stations.size() - 2];
        train.state = Train::IN_HOLDING;
        train.ticks_remaining = 0;
        train.arrival_time = tick;

        trains.push_back(train);

        // Add to appropriate platform's holding queue
        auto &station_platforms = platforms[terminal];
        for (auto &platform : station_platforms) {
          if (platform.next_station == train.next_station) {
            platform.holding_queue.push({tick, train.id});
            break;
          }
        }

        spawned[line]++;
      }
    }
  }

  void process_station(const string &station, size_t tick) {
    if (!manages_station(station)) {
      return;
    }

    auto &station_platforms = platforms[station];
    for (auto &platform : station_platforms) {
        // Process trains in holding queue
        while (!platform.holding_queue.empty()) {
            size_t train_id = platform.holding_queue.top().second;
            
            // Find the train
            Train *train = nullptr;
            for (auto &t : trains) {
                if (t.id == train_id) {
                    train = &t;
                    break;
                }
            }
            
            if (!train) continue;
            
            if (platform.train_id == SIZE_MAX) {
                // Platform is empty, move train to platform
                platform.train_id = train_id;
                train->state = Train::AT_PLATFORM;
                train->ticks_remaining = platform.load_gen.generate();
                
                if (rank == 1) {
                    std::cout << "Moving train " << train_id << " to platform" << std::endl;
                    std::cout << "Train " << train_id << " waiting at platform, "
                             << train->ticks_remaining << " ticks remaining" << std::endl;
                }
                break;
            } else if (platform.train_id == train_id) {
                // Train is at platform
                if (train->ticks_remaining == 0) {
                    // Try to move train to link
                    if (try_move_to_link(*train, platform)) {
                        break;
                    }
                } else {
                    train->ticks_remaining--;
                }
                break;
            } else {
                // Platform occupied by different train
                break;
            }
        }
    }
  }

  void handle_train_arrival(Train &train, Link &link, size_t tick) {
    string next_next = get_next_station(train);
    auto &dest_platforms = platforms[train.next_station];

    // Find appropriate platform
    Platform *target_platform = nullptr;
    for (auto &platform : dest_platforms) {
      if (platform.next_station == next_next) {
        target_platform = &platform;
        break;
      }
    }

    if (!target_platform)
      return;

    // Update train location
    train.current_station = train.next_station;
    train.next_station = next_next;
    link.train_id = -1;

    // Either place at platform or in holding
    if (target_platform->train_id == -1) {
      move_to_platform(train, *target_platform, tick);
    } else {
      train.state = Train::IN_HOLDING;
      target_platform->holding_queue.push({tick, train.id});
    }
  }

  string get_next_station(const Train &train) {
    const auto &line = station_lines.at(train.line);
    auto it = std::find(line.begin(), line.end(), train.next_station);
    if (it == line.end())
      return "";

    size_t pos = it - line.begin();
    if (pos == 0)
      return line[1];
    if (pos == line.size() - 1)
      return line[line.size() - 2];

    auto curr_it = std::find(line.begin(), line.end(), train.current_station);
    bool going_forward = curr_it == line.end() || (it - curr_it) > 0;

    return going_forward ? line[pos + 1] : line[pos - 1];
  }

  bool try_move_to_link(Train &train, Platform &platform) {
    if (rank == 1) {
        std::cout << "Trying to move train " << train.id << " from " << train.current_station 
                 << " to link towards " << train.next_station << std::endl;
    }

    // Find the appropriate link
    for (auto &link : links) {
        if (link.from_station == train.current_station && 
            link.to_station == train.next_station) {
            
            if (rank == 1) {
                std::cout << "Found matching link: from=" << link.from_station 
                         << " to=" << link.to_station 
                         << " train_id=" << link.train_id 
                         << " distance=" << link.distance << std::endl;
            }

            // Check if link is available
            if (link.train_id == SIZE_MAX || link.train_id == train.id) {
                // Move train to link
                link.train_id = train.id;
                platform.train_id = SIZE_MAX;  // Clear the platform
                platform.holding_queue.pop();  // Remove from holding queue
                
                // Update train state
                train.state = Train::IN_LINK;
                train.ticks_remaining = link.distance;
                
                // Send update to all processes
                TrainStateUpdate update;
                update.train_id = train.id;
                update.new_state = Train::IN_LINK;
                update.ticks_remaining = link.distance;
                strncpy(update.current_station, train.current_station.c_str(), 31);
                update.current_station[31] = '\0';
                
                MPI_Allreduce(MPI_IN_PLACE, &update, sizeof(TrainStateUpdate), 
                             MPI_BYTE, MPI_BOR, MPI_COMM_WORLD);
                
                if (rank == 1) {
                    std::cout << "Successfully moved train " << train.id 
                             << " to link, state=" << train.state
                             << ", ticks_remaining=" << train.ticks_remaining << std::endl;
                }
                return true;
            }
        }
    }

    if (rank == 1) {
        std::cout << "No suitable link found for train " << train.id << std::endl;
    }
    return false;
  }

  void move_to_platform(Train &train, Platform &platform, size_t tick) {
    if (rank == 0) {
        std::cout << "Moving train " << train.id << " to platform at " 
                  << train.current_station << std::endl;
    }

    train.state = Train::AT_PLATFORM;
    train.ticks_remaining = platform.load_gen.next(train.id);
    platform.train_id = train.id;
    train.arrival_time = tick;
  }

  void sync_state() {
    // Broadcast total number of trains
    int train_count = trains.size();
    MPI_Bcast(&train_count, 1, MPI_INT, 0, MPI_COMM_WORLD);

    if (rank != 0)
      trains.resize(train_count);

    // Pack train data into buffer for efficient communication
    vector<char> buffer;
    if (rank == 0) {
      for (const auto &train : trains) {
        // Pack train data
        size_t curr_len = train.current_station.length();
        size_t next_len = train.next_station.length();

        buffer.insert(buffer.end(), reinterpret_cast<const char *>(&train.id),
                      reinterpret_cast<const char *>(&train.id) +
                          sizeof(train.id));
        buffer.push_back(train.line);
        buffer.insert(
            buffer.end(), reinterpret_cast<const char *>(&train.state),
            reinterpret_cast<const char *>(&train.state) + sizeof(train.state));
        buffer.insert(buffer.end(),
                      reinterpret_cast<const char *>(&train.ticks_remaining),
                      reinterpret_cast<const char *>(&train.ticks_remaining) +
                          sizeof(train.ticks_remaining));
        buffer.insert(buffer.end(),
                      reinterpret_cast<const char *>(&train.arrival_time),
                      reinterpret_cast<const char *>(&train.arrival_time) +
                          sizeof(train.arrival_time));

        buffer.insert(buffer.end(), reinterpret_cast<const char *>(&curr_len),
                      reinterpret_cast<const char *>(&curr_len) +
                          sizeof(curr_len));
        buffer.insert(buffer.end(), train.current_station.begin(),
                      train.current_station.end());

        buffer.insert(buffer.end(), reinterpret_cast<const char *>(&next_len),
                      reinterpret_cast<const char *>(&next_len) +
                          sizeof(next_len));
        buffer.insert(buffer.end(), train.next_station.begin(),
                      train.next_station.end());
      }
    }

    // Broadcast buffer size and data
    int buffer_size = buffer.size();
    MPI_Bcast(&buffer_size, 1, MPI_INT, 0, MPI_COMM_WORLD);

    if (rank != 0)
      buffer.resize(buffer_size);
    MPI_Bcast(buffer.data(), buffer_size, MPI_CHAR, 0, MPI_COMM_WORLD);

    // Unpack buffer if not rank 0
    if (rank != 0) {
      size_t pos = 0;
      for (size_t i = 0; i < trains.size(); i++) {
        Train &train = trains[i];

        memcpy(&train.id, &buffer[pos], sizeof(train.id));
        pos += sizeof(train.id);

        train.line = buffer[pos++];

        memcpy(&train.state, &buffer[pos], sizeof(train.state));
        pos += sizeof(train.state);

        memcpy(&train.ticks_remaining, &buffer[pos],
               sizeof(train.ticks_remaining));
        pos += sizeof(train.ticks_remaining);

        memcpy(&train.arrival_time, &buffer[pos], sizeof(train.arrival_time));
        pos += sizeof(train.arrival_time);

        size_t curr_len, next_len;
        memcpy(&curr_len, &buffer[pos], sizeof(curr_len));
        pos += sizeof(curr_len);

        train.current_station = string(&buffer[pos], curr_len);
        pos += curr_len;

        memcpy(&next_len, &buffer[pos], sizeof(next_len));
        pos += sizeof(next_len);

        train.next_station = string(&buffer[pos], next_len);
        pos += next_len;
      }
    }
  }

  void print_state(size_t tick) {
    if (rank != 0)
      return;

    std::cout << tick << ": ";
    vector<string> train_strings;

    for (const auto &train : trains) {
      string state_str;
      switch (train.state) {
      case Train::IN_LINK:
        state_str = train.current_station + "->" + train.next_station;
        break;
      case Train::AT_PLATFORM:
        state_str = train.current_station + "%";
        break;
      case Train::IN_HOLDING:
        state_str = train.current_station + "#";
        break;
      }
      train_strings.push_back(train.line + std::to_string(train.id) + "-" +
                              state_str);
    }

    std::sort(train_strings.begin(), train_strings.end());
    for (size_t i = 0; i < train_strings.size(); i++) {
      std::cout << train_strings[i];
      if (i < train_strings.size() - 1)
        std::cout << " ";
    }
    std::cout << std::endl;
  }

public:
  MRTSimulation(size_t num_stations, const vector<string> &station_names,
                const vector<size_t> &popularities,
                const vector<vector<size_t>> &matrix,
                const std::unordered_map<char, vector<string>> &station_lines,
                size_t total_ticks,
                const std::unordered_map<char, size_t> &trains_per_line,
                int rank, int total_processes)
      : num_stations(num_stations), station_names(station_names),
        popularities(popularities), matrix(matrix),
        station_lines(station_lines), total_ticks(total_ticks),
        trains_per_line(trains_per_line), rank(rank),
        total_processes(total_processes) {
    initialize_network();
  }

  void run(size_t num_ticks_to_print) {
    for (size_t tick = 0; tick < total_ticks; tick++) {
        if (rank == 1) { // Debug output
            std::cout << "\nProcess " << rank << " starting tick " << tick << std::endl;
            std::cout << "Managing stations: ";
            for (size_t idx : my_stations) {
                std::cout << station_names[idx] << " ";
            }
            std::cout << std::endl;
        }

        if (rank == 0) {
            spawn_trains(tick);
        }

        sync_state();

        // Process stations assigned to this rank
        for (size_t station_idx : my_stations) {
            process_station(station_names[station_idx], tick);
        }

        MPI_Barrier(MPI_COMM_WORLD);
        sync_state();

        if (rank == 0) {
            std::cout << "State after processing tick " << tick << ":" << std::endl;
            for (const auto &train : trains) {
                std::cout << "Train " << train.id << ": state=" << train.state 
                          << ", current=" << train.current_station 
                          << ", next=" << train.next_station 
                          << ", ticks_remaining=" << train.ticks_remaining << std::endl;
            }
        }

        if (rank == 0 && tick >= total_ticks - num_ticks_to_print) {
            print_state(tick);
        }

        MPI_Barrier(MPI_COMM_WORLD);
    }
  }
};

void simulate(size_t num_stations, const vector<string> &station_names,
              const vector<size_t> &popularities,
              const vector<vector<size_t>> &matrix,
              const std::unordered_map<char, vector<string>> &station_lines,
              size_t total_ticks, std::unordered_map<char, size_t> num_trains,
              size_t num_ticks_to_print, size_t rank, size_t total_processes) {
  MRTSimulation sim(num_stations, station_names, popularities, matrix,
                    station_lines, total_ticks, num_trains, rank,
                    total_processes);

  sim.run(num_ticks_to_print);
}
