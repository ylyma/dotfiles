alias todo='task ready'
alias dtime='timew day'
alias wtime='timew week'
alias wsumtime='timew summary :week'
alias dsumtime='timew summary'
alias panmd2pdf='pandoc --from=markdown --to=pdf -V fonsize=12t -V colorlinks -V indent=true -V documentclass=amsart -V linestretch=1.5'
alias icat="kitten icat"
alias s="kitten ssh"
alias d="kitten diff"

alias vim="nvim"

alias cln="latexmk -c"
alias forti="sudo openfortivpn webvpn.comp.nus.edu.sg --username=e0969284"
alias rm='rm -i'
alias cp='cp -i'
alias mv='mv -i'
alias unmount='udisksctl unmount -b /dev/sdc1'
alias mount='udisksctl mount -b /dev/sdc1'

starship init fish | source

if status is-interactive
    # Commands to run in interactive sessions can go here
end

zoxide init fish | source
