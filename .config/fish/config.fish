alias todo='task ready'
alias dtime='timew day'
alias wtask='task burndown.weekly'
alias dtask='task burndown.daily'
alias panmd2pdf='pandoc --from=markdown --to=pdf -V fonsize=12t -V colorlinks -V indent=true -V documentclass=amsart -V linestretch=1.5'

if status is-interactive
    # Commands to run in interactive sessions can go here
end
