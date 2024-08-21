#!/bin/env bash


echo "installing packages"

# set password 
PASSWORD="[password]"
# Function to install packages
install_packages() {
    echo $PASSWORD | sudo -S pacman -S --noconfirm "$@"
}

# Update system first
echo $PASSWORD | sudo -S pacman -Syu --noconfirm

# Install packages
install_packages \
    amd-ucode base base-devel bat biber bluez bluez-utils clang cmake darktable \
    dhclient dialog discord dnsmasq dosfstools dunst efibootmgr fd firefox \
    firefox-tridactyl fish fisher flatpak fzf git github-cli gnome-keyring \
    greetd-tuigreet grim grub htop hyprland i3-wm i3blocks i3lock i3status kitty \
    libgme libreoffice-fresh linux linux-firmware mpv mtools ncspot neofetch neovim \
    networkmanager nm-connection-editor nodejs noto-fonts noto-fonts-cjk noto-fonts-emoji \
    npm openfortivpn openssh os-prober p7zip pandoc-cli pavucontrol pipewire-alsa \
    pipewire-jack pipewire-pulse postgresql python-pillow python-pip python-poetry \
    qutebrowser ranger ripgrep slurp sudo swaybg task telegram-desktop texlive-basic \
    texlive-bibtexextra texlive-binextra texlive-context texlive-fontsextra \
    texlive-fontsrecommended texlive-fontutils texlive-formatsextra texlive-humanities \
    texlive-latex texlive-latexextra texlive-latexrecommended texlive-luatex \
    texlive-mathscience texlive-metapost texlive-plaingeneric texlive-pstricks \
    texlive-publishers texlive-xetex thunar timew tree-sitter-cli ttf-firacode-nerd \
    ttf-font-awesome ttf-jetbrains-mono ttf-mononoki-nerd typescript udisks2 unrar \
    unzip vi vim waybar wl-clipboard wofi xdg-desktop-portal-hyprland-git xf86-video-vesa \
    xorg-bdftopcf xorg-docs xorg-font-util xorg-fonts-100dpi xorg-fonts-75dpi \
    xorg-fonts-encodings xorg-iceauth xorg-mkfontscale xorg-server xorg-server-common \
    xorg-server-devel xorg-server-xephyr xorg-server-xnest xorg-server-xvfb xorg-sessreg \
    xorg-setxkbmap xorg-smproxy xorg-x11perf xorg-xauth xorg-xbacklight xorg-xcmsdb \
    xorg-xcursorgen xorg-xdpyinfo xorg-xdriinfo xorg-xev xorg-xgamma xorg-xhost \
    xorg-xinit xorg-xinput xorg-xkbcomp xorg-xkbevd xorg-xkbutils xorg-xkill \
    xorg-xlsatoms xorg-xlsclients xorg-xmodmap xorg-xpr xorg-xprop xorg-xrandr \
    xorg-xrdb xorg-xrefresh xorg-xset xorg-xsetroot xorg-xvinfo xorg-xwayland \
    xorg-xwd xorg-xwininfo xorg-xwud zathura zathura-pdf-mupdf zk zoxide

# Install yay (AUR helper)
git clone https://aur.archlinux.org/yay.git
cd yay
makepkg -si --noconfirm
cd ..
rm -rf yay

# Install AUR packages
yay -S --noconfirm yay-debug

echo "...done"


# make symlinks
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

