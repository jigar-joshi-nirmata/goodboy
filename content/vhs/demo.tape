# goodboy — main demo  (run: vhs demo.tape)
Output demo.gif
Output demo.mp4

Set Shell "zsh"
Set FontSize 14
Set Width 1200
Set Height 780
Set Theme "Dracula"
Set Padding 24
Set Framerate 30
Set PlaybackSpeed 1
Set TypingSpeed 58ms

Hide
  Type "export GOODBOY_PROTOCOL=ascii && export PS1='$ '"
  Enter
  Sleep 300ms
  Type "cd /Users/f72xg6jcjd/Desktop/mercor/claude-plugin"
  Enter
  Sleep 300ms
  Type "node dist/index.js switch goldie > /dev/null 2>&1"
  Enter
  Sleep 300ms
Show

Sleep 800ms
Type "# goodboy — a Tamagotchi for your terminal"
Sleep 1.5s
Enter
Type "# picks up on your sessions, judges your code, and gates your friday deploys."
Enter
Sleep 2.5s
Ctrl+L

Sleep 300ms
Type "# morning. starting a new session."
Enter
Sleep 500ms
Type "node dist/index.js hook session-start"
Enter
Sleep 2.5s
Ctrl+L

Sleep 300ms
Type "# tests pass. the dog is pleased."
Enter
Sleep 400ms
Type 'echo '"'"'{"tool_name":"Bash","tool_input":{"command":"npm test"},"tool_response":{"exit_code":0}}'"'"' | node dist/index.js hook tool-use'
Enter
Sleep 2.5s
Ctrl+L

Sleep 300ms
Type "# rm -rf. the dog has very strong opinions."
Enter
Sleep 400ms
Type 'echo '"'"'{"tool_name":"Bash","tool_input":{"command":"rm -rf old_backup"},"tool_response":{"exit_code":0}}'"'"' | node dist/index.js hook tool-use'
Enter
Sleep 3s
Ctrl+L

Sleep 300ms
Type "node dist/index.js status"
Enter
Sleep 3.5s
Ctrl+L

Sleep 300ms
Type "node dist/index.js feed"
Enter
Sleep 2s
Ctrl+L

Sleep 300ms
Type "# switch personas anytime."
Enter
Sleep 400ms
Type "node dist/index.js switch shiba"
Enter
Sleep 2.5s
Ctrl+L

Sleep 300ms
Type "node dist/index.js speak"
Enter
Sleep 2.5s
Type "node dist/index.js beg"
Enter
Sleep 2.5s
Ctrl+L

Sleep 300ms
Type "# deploy gate. shiba does not negotiate."
Enter
Sleep 400ms
Type "node dist/index.js sit"
Enter
Sleep 2.5s
Ctrl+L

Sleep 300ms
Type "node dist/index.js hook session-end"
Enter
Sleep 4s
Ctrl+L

Sleep 500ms
Type "# npm install -g goodboy && goodboy init"
Sleep 4s
Enter
Sleep 1.5s
