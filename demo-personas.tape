# goodboy — all 6 personas  (run: vhs demo-personas.tape)
Output demo-personas.gif
Output demo-personas.mp4

Set Shell "zsh"
Set FontSize 14
Set Width 1100
Set Height 700
Set Theme "TokyoNight"
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
  Type "node dist/index.js hook session-start > /dev/null 2>&1"
  Enter
  Sleep 500ms
Show

Sleep 500ms
Type "# same event. 6 dogs. 6 completely different reactions."
Enter
Sleep 1.5s
Ctrl+L

Hide
  Type "node dist/index.js switch goldie > /dev/null 2>&1"
  Enter
  Sleep 200ms
Show
Sleep 300ms
Type "# goldie (golden retriever)"
Enter
Sleep 500ms
Type 'echo '"'"'{"tool_name":"Bash","tool_input":{"command":"git push --force origin main"},"tool_response":{"exit_code":0}}'"'"' | node dist/index.js hook tool-use'
Enter
Sleep 2.5s
Ctrl+L

Hide
  Type "node dist/index.js switch shiba > /dev/null 2>&1"
  Enter
  Sleep 200ms
Show
Sleep 300ms
Type "# shiba (shiba inu)"
Enter
Sleep 500ms
Type 'echo '"'"'{"tool_name":"Bash","tool_input":{"command":"git push --force origin main"},"tool_response":{"exit_code":0}}'"'"' | node dist/index.js hook tool-use'
Enter
Sleep 2.5s
Ctrl+L

Hide
  Type "node dist/index.js switch byte > /dev/null 2>&1"
  Enter
  Sleep 200ms
Show
Sleep 300ms
Type "# byte (border collie)"
Enter
Sleep 500ms
Type 'echo '"'"'{"tool_name":"Bash","tool_input":{"command":"git push --force origin main"},"tool_response":{"exit_code":0}}'"'"' | node dist/index.js hook tool-use'
Enter
Sleep 2.5s
Ctrl+L

Hide
  Type "node dist/index.js switch nova > /dev/null 2>&1"
  Enter
  Sleep 200ms
Show
Sleep 300ms
Type "# nova (husky)"
Enter
Sleep 500ms
Type 'echo '"'"'{"tool_name":"Bash","tool_input":{"command":"git push --force origin main"},"tool_response":{"exit_code":0}}'"'"' | node dist/index.js hook tool-use'
Enter
Sleep 2.5s
Ctrl+L

Sleep 400ms
Type "# goodboy switch <persona>  — pick your dog"
Sleep 3s
Enter
Sleep 1s
