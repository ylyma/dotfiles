export EDITOR="nvim"

alias todo='task ready'
alias panmd2pdf='pandoc --from=markdown --to=pdf -V fonsize=12t -V colorlinks -V indent=true -V documentclass=amsart -V linestretch=1.5'
alias icat="kitten icat"
alias d="kitten diff"

alias vim='nvim'

alias cln="latexmk -c"
alias forti="sudo openfortivpn webvpn.comp.nus.edu.sg --username=e0969284"

alias rm='rm -i'
alias cp='cp -i'
alias mv='mv -i'
alias unmount='udisksctl unmount -b /dev/sdc1'
alias mount='udisksctl mount -b /dev/sdc1'
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
starship init fish | source

if status is-interactive
    # Commands to run in interactive sessions can go here
end

zoxide init fish | source
