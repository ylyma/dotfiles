export EDITOR="nvim"

# editor commands
alias todo='task ready'
alias panmd2pdf='pandoc --from=markdown --to=pdf -V fonsize=12t -V colorlinks -V indent=true -V documentclass=amsart -V linestretch=1.5'
alias icat="kitten icat"
alias d="kitten diff"
alias vim='nvim'
alias cln="latexmk -c"

# alias forti="sudo openfortivpn webvpn.comp.nus.edu.sg --username=e0969284"

# nmcli commands
alias wifi-scan="nmcli device wifi list"
function wifi_con
	set username $arg[1]
	set passwd $arg[2]
	if test (count $argv) -ne 2
		echo "Usage: wifi_con <network_name> <password>"
		return 1
	end
	
	nmcli device wifi connect $username password "$passwd"
end

# ssh shortcuts
alias uremote="fusermount -u /home/amy/mounts/remote"
alias bridges="ssh -X jwang53@bridges2.psc.edu"
alias socc-shared="ssh tkr@xlogin.comp.nus.edu.sg"
alias socc="ssh amyling@xlogin.comp.nus.edu.sg"
alias scct="ssh rocky@scct.comp.nus.edu"
alias vm="ssh -p 2222 amy@localhost"
alias wing1="ssh amyling@ecp.d2.comp.nus.edu.sg"
alias wing2="ssh amyling@mce.d2.comp.nus.edu.sg"

# basic cli commands
alias rm='rm -i'
alias cp='cp -i'
alias mv='mv -i'
alias unmount='udisksctl unmount -b'
alias mount='udisksctl mount -b'

function fish_greeting 
    set -l counts
    set counts[1] (task rc.gc=off status:pending count 2>/dev/null)
    set counts[2] (task rc.gc=off status:pending due.after:yesterday and due.before:week count 2>/dev/null)    

    if test $status -eq 0
        set -l total $counts[1]
        set -l this_week $counts[2]
        
        echo (set_color brwhite)" Welcome back"(set_color normal)", $USER"
        echo (set_color brblack)" "(date "+%A, %B %d at %H:%M")(set_color normal)
        echo 
        printf "%s %s\n" \
            (set_color yellow)"󰨳 Weekly tasks:"(set_color normal) $this_week \
            (set_color red)" Total tasks: "(set_color normal) $total
    else
        echo Welcome, $USER. The time is (set_color green)(date "+%a %d %H:%M")(set_color normal)
    end
end
function duc
	set dir $argv[1]
	if test -z "$dir"
		set dir "."
	end
	sudo du -hsx $dir/* | sort -rh | head -n 10
end

starship init fish | source

if status is-interactive
    # Commands to run in interactive sessions can go here
end

zoxide init fish | source


# BEGIN opam configuration
# This is useful if you're using opam as it adds:
#   - the correct directories to the PATH
#   - auto-completion for the opam binary
# This section can be safely removed at any time if needed.
test -r '/home/amy/.opam/opam-init/init.fish' && source '/home/amy/.opam/opam-init/init.fish' > /dev/null 2> /dev/null; or true
# END opam configuration
