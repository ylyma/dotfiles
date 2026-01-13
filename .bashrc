# History
HISTCONTROL=ignoreboth
HISTSIZE=1000
HISTFILESIZE=2000
shopt -s histappend

# Check window size after each command
shopt -s checkwinsize

# Color prompt
PS1='\[\033[01;32m\]\u@\h\[\033[00m\]:\[\033[01;34m\]\w\[\033[00m\]\$ '

# Color support
alias ls='ls --color=auto'
alias dir='dir --color=auto'
alias grep='grep --color=auto'

# Colored GCC warnings and errors
export GCC_COLORS='error=01;31:warning=01;35:note=01;36:caret=01;32:locus=01:quote=01'

# nnn config
nn() {
    if [[ -n "$NNNLVL" && "$NNNLVL" -ge 1 ]]; then
        echo "nnn is already running"
        return
    fi

    export NNN_TMPFILE="${XDG_CONFIG_HOME:-$HOME/.config}/nnn/.lastd"
    command nnn "$@"

    if [[ -e "$NNN_TMPFILE" ]]; then
        source "$NNN_TMPFILE"
        rm -f -- "$NNN_TMPFILE"
    fi
}
export NNN_PLUG='j:autojump;o:fzopen;p:preview-tui;d:diffs;t:nmount;g:-!git diff;l:-!git log;x:!chmod +x "$nnn";s:!readlink -f "$nnn"|wl-copy*'
export NNN_FCOLORS="0B0B04060006060009060B06"

# Aliases
[ -f ~/.bash_aliases ] && . ~/.bash_aliases

# Rust
. "$HOME/.cargo/env"
