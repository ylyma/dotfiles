void process_station(const string &station, size_t tick) {
    // Debug print for platform availability
    if (rank == 1) {
        cout << "Processing station " << station << " platforms:" << endl;
        for (size_t i = 0; i < platforms[station].size(); i++) {
            cout << "Platform " << i << ": train_id=" << platforms[station][i].train_id 
                 << " next_station=" << platforms[station][i].next_station << endl;
        }
    }

    // First try to move trains from holding to platforms
    auto &station_platforms = platforms[station];
    for (auto &train : trains) {
        if (train.state == Train::IN_HOLDING && train.current_station == station) {
            // Debug print for each holding train
            if (rank == 1) {
                cout << "Found holding train " << train.id << " at station " << station 
                     << " trying to go to " << train.next_station << endl;
            }

            // Try to find an empty platform going to the right destination
            for (auto &platform : station_platforms) {
                if (platform.train_id == -1 && platform.next_station == train.next_station) {
                    if (rank == 1) {
                        cout << "Moving train " << train.id << " to platform" << endl;
                    }
                    platform.train_id = train.id;
                    train.state = Train::AT_PLATFORM;
                    train.ticks_remaining = popularities[get_station_index(station)];
                    break;
                }
            }
        }
    }

    // Then process trains at platforms
    for (auto &platform : station_platforms) {
        if (platform.train_id != -1) {
            Train &train = trains[platform.train_id];
            if (train.ticks_remaining > 0) {
                train.ticks_remaining--;
            } else {
                // Try to move to link
                if (try_move_to_link(train, platform)) {
                    platform.train_id = -1;  // Clear the platform
                }
            }
        }
    }
}

bool try_move_to_link(Train &train, Platform &platform) {
    if (rank == 1) {
        cout << "Trying to move train " << train.id << " from " << train.current_station 
             << " to link towards " << train.next_station << endl;
    }

    // Find the appropriate link
    for (auto &link : links) {
        if (link.from_station == train.current_station && 
            link.to_station == train.next_station && 
            link.train_id == -1) {
            
            if (rank == 1) {
                cout << "Found empty link for train " << train.id << endl;
            }

            link.train_id = train.id;
            train.state = Train::IN_LINK;
            train.ticks_remaining = link.distance;
            return true;
        }
    }
    return false;
} 