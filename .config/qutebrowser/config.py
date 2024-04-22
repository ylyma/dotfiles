## qutebrowser config.py

from typing import TYPE_CHECKING, Any
import catppuccin
from qutebrowser.api import interceptor

if TYPE_CHECKING:
    c: Any = object
    config: Any = object

config.load_autoconfig()

# ui
catppuccin.setup(c, 'mocha', True)
c.colors.webpage.preferred_color_scheme = "dark"
c.completion.shrink = True
c.completion.use_best_match = True
c.downloads.position = "bottom"
c.downloads.remove_finished = 10000
c.statusbar.widgets = ["progress", "keypress", "url", "history"]
c.scrolling.bar = "always"
c.tabs.position = "left"
c.tabs.title.format = "{index}: {audio}{current_title}"
c.tabs.title.format_pinned = "{index}: {audio}{current_title}"

# general
c.auto_save.session = True
c.content.default_encoding = "utf-8"
c.content.javascript.clipboard = "access"
c.content.notifications.enabled = True
c.editor.command = ["kitty", "kak", "-e", "exec {line}g{column0}l", "{}"]
c.fileselect.handler = "external"
c.fileselect.single_file.command = ["kitty", "sh", "-c", "xplr > {}"]
c.fileselect.multiple_files.command = ["kitty", "sh", "-c", "xplr > {}"]
c.downloads.location.prompt = False
c.input.insert_mode.auto_load = True
c.spellcheck.languages = ["en-US"]
c.tabs.show = "multiple"
c.tabs.last_close = "close"
c.tabs.mousewheel_switching = False

# privacy
c.content.cookies.accept = "no-3rdparty"
c.content.webrtc_ip_handling_policy = "default-public-interface-only"

# urls
c.url.searchengines = {
    "DEFAULT": "https://google.com/search?q={}",
    "?": "https://google.com/search?q={}",
}
c.url.default_page = "~/.config/qutebrowser/blank.html"
c.url.start_pages = ["~/.config/qutebrowser/blank.html"]

# per-domain settings
config.set("content.register_protocol_handler", True, "*://calendar.google.com")

config.set("content.register_protocol_handler", False, "*://outlook.office365.com")

config.set("content.media.audio_video_capture", True, "*://app.wire.com")
config.set("content.media.audio_capture", True, "*://app.wire.com")
config.set("content.media.video_capture", True, "*://app.wire.com")
config.set("content.desktop_capture", True, "*://app.wire.com")
config.set("content.desktop_capture", True, "*://app.wire.com")
config.set("content.notifications.show_origin", False, "*://app.wire.com")

config.set("content.register_protocol_handler", True, "*://teams.microsoft.com")
config.set("content.media.audio_video_capture", True, "*://teams.microsoft.com")
config.set("content.media.audio_capture", True, "*://teams.microsoft.com")
config.set("content.media.video_capture", True, "*://teams.microsoft.com")
config.set("content.desktop_capture", True, "*://teams.microsoft.com")
config.set("content.cookies.accept", "all", "*://teams.microsoft.com")

# keys
bindings = {
    ",d": "download-open",
    ",m": "hint links spawn cglaunch mpv '{hint-url}'",
    ",p": "spawn --userscript qute-pass --username-target secret --username-pattern 'user: (.+)' --dmenu-invocation 'dmenu -p credentials'",
    ",P": "spawn --userscript qute-pass --username-target secret --username-pattern 'user: (.+)' --dmenu-invocation 'dmenu -p password' --password-only",
    ",b": "config-cycle colors.webpage.bg '#1d2021' 'white'",
    ";I": "hint images download",
    "<Ctrl-Shift-J>": "tab-move +",
    "<Ctrl-Shift-K>": "tab-move -",
    "M": "nop",
    "co": "nop",
    "<Shift-Escape>": "fake-key <Escape>",
    "o": "cmd-set-text -s :open -s",
    "O": "cmd-set-text -s :open -t -s",
    "xt": "config-cycle tabs.show always never",
    "xs": "config-cycle statusbar.show always never",
    "xx": "config-cycle tabs.show always never;; config-cycle statusbar.show always never",
}

for key, bind in bindings.items():
    config.bind(key, bind)


# Block youtube ads
def filter_youtube(info: interceptor.Request):
    """Block given request if necessary"""
    url = info.request_url
    if (
        url.host() == "www.youtube.com"
        and url.path() == "/get_video_info"
        and "&adformat=" in url.query()
    ):
        info.block

interceptor.register(filter_youtube)
