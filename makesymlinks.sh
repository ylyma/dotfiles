#!/bin/env bash
# .make.sh

dir=~/dotfiles
files="bashrc bash_profile xinitrc config"
backupdir=~/dotfiles_backup

echo -n "backing up existing dotfiles in ~"
mkdir -p $backupdir
echo "...done"

echo -n "changing to $dir directory"
cd $dir
echo "...done"

for file in $files; do
	echo "moving existing dotfiles from ~ to $backupdir"
	mv ~/.$file ~/dotfiles_backup/
	echo "creating symlink to $file in ~"
	ln -s $dir/.$file ~/.$file
done

