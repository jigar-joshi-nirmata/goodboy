# goodboy — 15s social hook  (run: vhs demo-quick.tape)
Output demo-quick.gif
Output demo-quick.mp4

Set Shell "zsh"
Set FontSize 15
Set Width 1100
Set Height 680
Set Theme "Dracula"
Set Padding 20
Set Framerate 30
Set PlaybackSpeed 1
Set TypingSpeed 55ms

Hide
  Type "export GOODBOY_PROTOCOL=ascii && export PS1='$ '"
  Enter
  Sleep 300ms
  Type "cd /Users/f72xg6jcjd/Desktop/mercor/claude-plugin"
  Enter
  Sleep 300ms
  Type "node dist/index.js switch goldie > /dev/null 2>&1 && node dist/index.js hook session-start > /dev/null 2>&1"
  Enter
  Sleep 800ms
Show

Sleep 500ms
Type 'echo '"'"'{"tool_name":"Bash","tool_input":{"command":"rm -rf old_backup"},"tool_response":{"exit_code":0}}'"'"' | node dist/index.js hook tool-use'
Enter
Sleep 2.5s
Ctrl+L

Sleep 300ms
Type "node dist/index.js switch byte"
Enter
Sleep 2.5s
Ctrl+L

Sleep 300ms
Type "node dist/index.js speak"
Enter
Sleep 2.5s
Ctrl+L

Sleep 300ms
Type "node dist/index.js status"
Enter
Sleep 3.5s
Ctrl+L

Sleep 300ms
Type "# npm install -g goodboy"
Sleep 3s
Enter
Sleep 1s
