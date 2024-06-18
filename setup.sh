#!/bin/sh
clear

#UPDATE SYSTEM AFTER FIRST BOOT AND INSTALLING SERVICES
sudo apt update && sudo apt upgrade -y

sudo apt install git gnome-tweaks virtualbox plymouth touchegg -y

#INSTALLING EXTENSIONS
cp -r assets/extensions ~/.local/share/gnome-shell/

#REMOVE SNAP APPS AND SERVICES
sudo snap remove --purge firefox
sudo snap remove --purge snap-store
sudo snap remove --purge gnome-42-2204
sudo snap remove --purge gtk-common-themes
sudo snap remove --purge snapd-desktop-integration
sudo snap remove --purge firmware-updater
sudo snap remove --purge core22
sudo snap remove --purge bare
sudo snap remove --purge snapd
sudo apt autoremove --remove snapd -y
sudo rm -rf /var/cache/snapd/

#FLATPAK SETUP
sudo apt install flatpak gnome-software-plugin-flatpak -y
flatpak remote-add --if-not-exists flathub https://dl.flathub.org/repo/flathub.flatpakrepo

#INSTALLING APPS
flatpak install flathub org.mozilla.firefox com.visualstudio.code com.mattjakeman.ExtensionManager -y

#IMPORTING AND INSTALLING WHITESUR THEME
cd assets/shell
git clone https://github.com/vinceliuice/WhiteSur-gtk-theme.git
git clone https://github.com/vinceliuice/WhiteSur-icon-theme.git

WhiteSur-gtk-theme/install.sh -o normal -c Dark -t red -m -l -r
sudo WhiteSur-gtk-theme/tweaks.sh -g -c Dark -t grey
WhiteSur-gtk-theme/tweaks.sh -f monterey
WhiteSur-gtk-theme/tweaks.sh -d
WhiteSur-icon-theme/install.sh -t red -a -b

sudo flatpak override --filesystem=~/.themes
sudo flatpak override --filesystem=~/.local/share/icons
sudo flatpak override --filesystem=xdg-config/gtk-4.0

sudo cp -r oreo /usr/local/icons/
cp -r fonts ~/.local/share/
cp wallpaper.jpg ~/.local/share/backgrounds/
cd ~/postinstall/assets/

#ENABLE PLYMOUTH THEME
sudo cp -r plymouth/macOS /usr/share/plymouth/themes
sudo update-alternatives --install /usr/share/plymouth/themes/default.plymouth default.plymouth /usr/share/plymouth/themes/macOS/macOS.plymouth 100
sudo update-alternatives --config default.plymouth
sudo update-initramfs -u

#APPLY CHANGES
dconf load / < ../dconf-settings.ini

#REBOOT SYSTEM
sudo reboot


