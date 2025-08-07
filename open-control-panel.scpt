#!/usr/bin/osascript

# AppleScript per aprire il pannello di controllo
# Salva questo file come "open-control-panel.scpt"

tell application "Google Chrome"
    activate
    open location "file:///Users/lucamambelli/Desktop/Gestione-Calcio/control-panel.html"
end tell

tell application "Google Chrome"
    tell window 1
        set bounds to {100, 50, 1400, 900}
    end tell
end tell

display notification "Pannello di controllo aperto!" with title "Soccer Management" subtitle "Pronto per lo sviluppo" sound name "Glass"
