alias todo='task ready'
alias dtime='timew day'
alias wtime='timew week'
alias wsumtime='timew summary :week'
alias dsumtime='timew summary'
alias panmd2pdf='pandoc --from=markdown --to=pdf -V fonsize=12t -V colorlinks -V indent=true -V documentclass=amsart -V linestretch=1.5'
alias icat="kitten icat"
alias s="kitten ssh"
alias d="kitten diff"

alias rm='rm -i'
alias cp='cp -i'
alias mv='mv -i'
alias unmount='udisksctl unmount -b /dev/sdc1'
alias mount='udisksctl mount -b /dev/sdc1'

if status is-interactive
    # Commands to run in interactive sessions can go here
end

zoxide init fish | source
