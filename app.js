/* ============================================================
   EllS 介绍站行为脚本（无依赖、无构建）
   1) 识别访客操作系统 → 选中并推荐对应的一行安装命令
   2) 一键复制（hero 主命令 + 页面所有代码块）
   3) 安装平台 / 快捷键分页切换
   4) 中 / 英双语切换（默认中文，选择记在 localStorage）
   ============================================================ */
(function () {
  'use strict';

  var REPO_RAW = 'https://raw.githubusercontent.com/lg10/ells/main';

  var CMD = {
    windows: 'irm ' + REPO_RAW + '/install.ps1 | iex',
    macos: 'curl -fsSL ' + REPO_RAW + '/install.sh | sh',
    linux: 'curl -fsSL ' + REPO_RAW + '/install.sh | sh'
  };

  var OS_NAME = { windows: 'Windows', macos: 'macOS', linux: 'Linux' };

  var SHELL_NOTE = {
    windows: {
      zh: '在 PowerShell 里运行；脚本会强制校验 SHA256SUMS.txt，校验不过直接退出。',
      en: 'Run it in PowerShell. The script enforces SHA256SUMS.txt and exits if the checksum fails.'
    },
    macos: {
      zh: '在终端（bash / zsh）里运行；通用二进制，Apple Silicon 与 Intel 都是这一行命令。',
      en: 'Run it in your terminal (bash / zsh). A universal binary — same command on Apple Silicon and Intel.'
    },
    linux: {
      zh: '在终端（bash / zsh）里运行；x86_64 走预编译包，aarch64 请从源码构建。',
      en: 'Run it in your terminal (bash / zsh). x86_64 uses the prebuilt asset; build from source on aarch64.'
    }
  };

  var ZH_TITLE = 'EllS · 活在终端里的轻量级跨平台 SSH 客户端';
  var ZH_DESC = 'EllS 是用 Rust 编写的一体化终端 SSH 客户端：TUI 内嵌真正的 vt100 终端、加密凭据保险库、SFTP 文件浏览、Xshell 风格的 sz/rz 传输拦截、多会话标签页与应用内更新。支持 Windows、macOS 与 Linux，一行命令安装。';

  /* ---------- 英文文案（中文即 HTML 原文，切回时还原） ---------- */
  var EN = {
    'brand.tag': 'SSH client that lives in your terminal',
    'nav.features': 'Features', 'nav.screens': 'Screens', 'nav.install': 'Install',
    'nav.usage': 'Usage', 'nav.keys': 'Shortcuts', 'nav.faq': 'FAQ',

    'hero.lede': 'A lightweight, cross-platform SSH client that lives inside your terminal.',
    'hero.sub': 'Written in pure Rust, EllS embeds a real terminal emulator in a fast TUI: remote colors, vim and htop all render correctly. On top of that it adds the workflow pieces plain ssh lacks — an encrypted credential vault, SFTP browsing and Xshell-style sz/rz transfer interception — all reachable with a few keystrokes or a single click.',
    'hero.copy': 'Copy',
    'hero.reopen': 'After installing, <strong>reopen your terminal</strong> and <code>ells</code> plus the short command <code>s</code> are ready to use.',
    'hero.cta.install': 'Full install guide', 'hero.cta.release': 'Download binaries',
    'hero.badge.license': 'MIT licensed', 'hero.badge.platform': 'Windows · macOS · Linux',
    'hero.badge.telemetry': 'No telemetry', 'hero.badge.size': 'Single binary, no runtime deps',

    'screens.ipnote': '🔒 Every screen below is a faithful, verbatim reproduction of how EllS really renders. Host addresses and usernames are replaced with documentation ranges (203.0.113.0/24, 198.51.100.0/24) and example accounts — no real IP appears anywhere.',

    'features.h2': 'What it does',
    'features.sub': 'EllS is not a GUI and it does not replace your terminal emulator. It fills in the workflow pieces plain ssh is missing, as keystrokes or clicks.',
    'f.vault.t': 'Encrypted vault', 'f.vault.d': 'Hosts and passwords live in <code>~/.ells/vault.bin</code>, protected by a master password: Argon2id key derivation + XChaCha20Poly1305 authenticated encryption. Supports passwordless auto-unlock and in-app master password change.',
    'f.hosts.t': 'Hosts & jump hosts', 'f.hosts.d': 'Aliases, per-host auth method (password / private key), notes, and ProxyJump bastions: <code>ells → jump → target</code>, with built-in loop detection.',
    'f.keys.t': 'Every common key format', 'f.keys.d': 'PKCS#8, PKCS#1 RSA, OpenSSH format — and legacy DEK-Info / 3DES encrypted PEM is decrypted natively by EllS, no conversion step.',
    'f.term.t': 'A real embedded terminal', 'f.term.d': 'A vt100 emulator with full ANSI / 256-color / truecolor support, so vim and htop look right. <code>Ctrl-Q</code> flips to passthrough mode as an escape hatch; <code>Ctrl-L</code> redraws.',
    'f.zmodem.t': 'sz / rz interception', 'f.zmodem.d': 'EllS detects the ZMODEM handshake in the remote output stream (tuned against real lrzsz byte streams) and reroutes it through SFTP: progress bar, native OS file dialogs, and no ZMODEM server needed on the remote side.',
    'f.sftp.t': 'SFTP file browser', 'f.sftp.d': 'Open with <code>Ctrl-S</code> inside a session: <code>Enter</code> to enter/download, <code>u</code> upload, <code>d</code> download. Mouse clicks and scroll work, with an aggregate progress bar and a transfer detail popup.',
    'f.hl.t': 'Output highlighting', 'f.hl.d': '<code>docker ps</code> is colored per column (container ID / image name / version tag / container name each get their own shade, the command is muted), plus kubectl, log levels, HTTP methods, IPv4 and percentages — never overriding colors the program emitted itself.',
    'f.tabs.t': 'Multi-session tabs', 'f.tabs.d': 'One process, many servers: <code>F2</code> new tab, <code>F5</code>/<code>F6</code> or a click to switch, <code>Ctrl-]</code> to close. Background tabs keep streaming and transferring — switch back and it’s all still there.',
    'f.tofu.t': 'Host key TOFU', 'f.tofu.d': 'The first connection is confirmed and recorded in <code>~/.ells/known_hosts</code> (OpenSSH-compatible format; <code>~/.ssh/known_hosts</code> is read too). A key change blocks with a warning. For bulk use, <code>-y</code> accepts first sightings only — changed keys are still refused.',
    'f.update.t': 'In-app updates', 'f.update.d': 'One background version check at startup (a single HEAD request, no anonymous API quota spent), an updatable badge at the top; click it, confirm, and EllS downloads, streams a SHA256 check against <code>SHA256SUMS.txt</code>, then replaces itself in place. A failed check never replaces anything.',
    'f.keep.t': 'Keepalive & mouse friendly', 'f.keep.d': 'Configurable SSH keepalive (15–300s) survives cloud NAT idle timeouts; drag-select copies (OSC 52), the wheel scrolls history while keeping colors, and interface elements are clickable.',
    'f.zh.t': 'Chinese UI & themes', 'f.zh.d': 'Fully localized interface, native OS file dialogs, zero telemetry. Colors live in a theme layer with four themes (dark / follow-terminal / high-contrast / light) previewed instantly. Press <code>i</code> in the host list to import <code>~/.ssh/config</code>.',

    'screens.h2': 'What it looks like',
    'screens.sub': 'Every screen works by keyboard and by mouse in parallel. The shots below match the real wording and palette EllS renders.',
    'shot.list.cap': 'Host list: one server per line, <code>●</code> means it’s already connected — Enter connects or switches back to that tab.',
    'shot.session.cap': 'Session + highlighting: container ID / image / version tag / container name each get their own color in docker ps, while log levels, HTTP methods, IPv4 and percentages are tinted instantly. Timestamps and COMMAND fade to gray so the eye lands where it should.',
    'shot.browser.cap': 'SFTP browser: directories in cyan, files in normal color, Enter to enter or download. The transfer popup shows bytes and live throughput per job, and Ctrl-C cancels every in-flight transfer.',
    'shot.settings.cap': 'Global settings: highlighting, keepalive interval, master password protection, key rebinding, UI theme and auto-update live on one screen. Nothing is written to <code>~/.ells/settings.ini</code> until you press Save.',
    'shot.update.cap': 'In-app update: click the badge → confirm → download while hashing SHA256 on the fly; only after it matches <code>SHA256SUMS.txt</code> does EllS replace itself. Cancel any time — no temp file left behind.',
    'shot.unlock.cap': 'First run: set the master password and create the vault. EllS puts the risk right at the top — the master password cannot be recovered, and it never leaves this machine.',

    'install.h2': 'Install',
    'install.sub': 'One command does it all: the script picks the right platform and architecture, enforces <code>SHA256SUMS.txt</code> verification, puts the binary on PATH and registers the short command <code>s</code>. If the checksum fails it exits — never half-installed.',
    'install.oneline': 'One-line install',
    'install.win.lead': 'Run in PowerShell (built into Windows 10/11):',
    'install.win.n1': 'Produces <code>ells.exe</code>; a running older build is renamed to <code>ells.exe.old</code> and cleaned up on the next start.',
    'install.win.n2': 'The <code>s</code> shortcut is registered as a function in your PowerShell profile; cmd needs nothing extra.',
    'install.win.n3': 'Use <strong>Windows Terminal</strong> — legacy conhost handles mouse and OSC 52 poorly.',
    'install.mac.lead': 'Run in your terminal (bash / zsh):',
    'install.mac.n1': 'The release asset is a universal binary (<code>ells-macos-universal</code>): Intel and Apple Silicon install from the same line, the script picks correctly.',
    'install.mac.n2': 'On macOS the default theme is “follow terminal”, so you never get a mismatched gray band.',
    'install.mac.n3': 'iTerm2 is recommended: Terminal.app has no OSC 52 clipboard, and function keys default to media keys, so <code>F2</code>/<code>F3</code> need <code>fn</code> unless you change System Settings.',
    'install.linux.lead': 'Run in your terminal (bash / zsh):',
    'install.linux.n1': 'x86_64 ships a prebuilt asset (<code>ells-linux-x86_64</code>); build from source on aarch64 (see below).',
    'install.linux.n2': 'Native file dialogs need a desktop session (X11 / Wayland) — they can’t appear in a headless TTY. Connecting via <code>s &lt;alias&gt;</code> and the SFTP shortcuts keep working.',
    'install.linux.n3': 'GNOME / KDE terminals usually claim <code>F10</code>/<code>F11</code>; free them in preferences if you want them.',
    'install.vars.h': 'Pin a version / directory / mirror',
    'install.vars.p': 'Override via environment variables — the installer and the in-app updater share one contract:',
    'install.vars.mirror': '<code>ELLS_API_URL</code> swaps the release-lookup endpoint and <code>ELLS_DOWNLOAD_URL</code> swaps the asset base, so both can point at an intranet mirror. If installation misbehaves, run <code>sh diagnose.sh</code> first — it prints how your shell, curl, architecture and proxy were resolved.',
    'install.src.h': 'Build from source',
    'install.src.p': 'Requires <strong>Rust 1.85+</strong> (edition 2024). The codebase contains no platform-specific code: crypto is <code>ring</code> throughout, the terminal stack is pure Rust.',
    'install.src.dep': 'Source builds on Linux need <code>pkg-config libwayland-dev</code> first (the file picker goes through the XDG portal, which depends on wayland). Prebuilt binaries and the one-line install do not.',
    'install.un.h': 'Uninstall',
    'install.un.p': 'Uninstalling only removes the binary, its PATH entry and the <code>s</code> function — <strong>it keeps <code>~/.ells</code> by default</strong> (vault, <code>known_hosts</code>, settings). Removing a binary shouldn’t destroy credentials. EllS never writes to the registry, so deleting the binary by hand is just as clean. Use <code>--purge</code> / <code>ELLS_PURGE=1</code> only once you’re sure about those hosts.',

    'usage.h2': 'How to use it',
    'usage.sub': 'Five steps to get going; after that, daily use is <code>s</code> plus a few keys.',
    'usage.s1.h': 'Install, then reopen the terminal', 'usage.s1.p': 'The script configures PATH, so a fresh window is required. <code>ells</code> and the short command <code>s</code> are equivalent.',
    'usage.s2.h': 'Set a master password, create the vault', 'usage.s2.p': 'The first run walks you through a master password and creates <code>~/.ells/vault.bin</code>. Afterwards you type it at startup — or turn protection off in settings for auto-unlock (credentials still stay encrypted on your machine).',
    'usage.s3.h': 'Press <code>a</code> to add a host, Enter to connect', 'usage.s3.p': 'The form asks for alias, host, port, user, auth method (<code>←/→</code> toggles password / key) and a note; <code>Ctrl-F</code> picks a private key, <code>Ctrl-J</code> picks a bastion. Hosts already in <code>~/.ssh/config</code> come over with a single <code>i</code>. First connections go through host key TOFU: verify the fingerprint, accept, record — and a later key change blocks with a warning.',
    'usage.s4.h': 'Work inside the session', 'usage.s4.p': '<code>Ctrl-S</code> opens the SFTP browser (<code>u</code> upload, <code>d</code> download, <code>m</code> mkdir, <code>n</code> rename, <code>D</code> delete); typing <code>sz</code>/<code>rz</code> remotely is intercepted and also routed over SFTP with a native file dialog. The wheel scrolls output, drag-select copies, <code>F3</code> searches history, <code>Ctrl-Q</code> toggles passthrough, and <code>Ctrl-G</code> returns to the list while staying connected.',
    'usage.s5.h': 'Open more tabs; new versions surface themselves', 'usage.s5.p': '<code>F2</code> puts another server in a new tab, <code>F5</code>/<code>F6</code> or a click switches; background tabs keep running. When a newer release exists the list shows <code>【vX.Y.Z updatable】</code> at the top — confirm once and it is downloaded and swapped in, effective on restart.',
    'usage.cli.h': 'Command line',
    'usage.cli.alias': 'Connect to this alias right after unlocking (<code>s &lt;alias&gt;</code> means the same)',
    'usage.cli.dev': 'Read plaintext hosts from <code>~/.ells/hosts.dev.toml</code> (development only, nothing is persisted)',
    'usage.cli.yes': 'Auto-accept and record first-seen host keys; changed keys are still refused',
    'usage.cli.check': 'Only check for a newer release, print the result and exit (no download, no UI)',
    'usage.env.h': 'Environment & files',
    'usage.env.log': 'Write internal logs to stderr',
    'usage.env.zmodem': 'Additionally write sz/rz interception diagnostics to <code>~/.ells/zmodem.log</code>',
    'usage.env.yes': 'Equivalent to <code>-y</code>',
    'usage.env.mirror': 'Point version lookup and downloads at an intranet mirror (same contract as the installer)',
    'usage.env.inst': 'Used by the installer: pin a version, pin an install directory',
    'usage.files': 'Everything lives in <code>~/.ells/</code>: <code>vault.bin</code> (the vault), <code>settings.ini</code> (settings & theme), <code>known_hosts</code> (host keys, OpenSSH-compatible), <code>update.cache</code> (last update check — just the version and a timestamp, no host data).',
    'usage.upd.h': 'What an in-app update actually does',
    'usage.upd.p': 'At every start EllS asks once whether a newer release exists — a single HEAD request, reading the version off GitHub’s redirect target, downloading nothing and spending no anonymous API quota. After you click the badge and confirm, it does four things in order:',
    'usage.upd.1': 'Downloads the release asset for your platform into a temp file next to the EllS binary.',
    'usage.upd.2': '<strong>Hashes SHA256 while downloading</strong> and compares against <code>SHA256SUMS.txt</code>; if it fails (or the download is incomplete) the temp file is deleted and <strong>nothing is replaced</strong>.',
    'usage.upd.3': 'Swaps in the new binary in place. On Windows a running image can’t be deleted but can be renamed, so <code>ells.exe</code> becomes <code>ells.exe.old</code> first and this session finishes normally; a failed swap is reverted.',
    'usage.upd.4': 'Reports “new version in place” — the disk is new, the process is still old; press Restart or Enter to switch. The confirmation dialog states up front how many live sessions a restart would drop.',
    'usage.upd.off': 'Don’t want it checking on its own: turn “auto-update” off with <code>←</code> in settings (writes <code>auto_update=false</code>) — manual checking stays available on the same row. A failed automatic check at startup is silent (no network shouldn’t block you); only a manual check shows the reason. Platforms without a prebuilt asset (e.g. Linux aarch64) never attempt self-replacement and are pointed at the installer instead.',

    'keys.h2': 'Keyboard shortcuts',
    'keys.sub': 'Every tab/session binding listed here (<code>F2</code>/<code>F5</code>/<code>F6</code>/<code>Ctrl-]</code>/<code>Ctrl-G</code>/<code>Ctrl-S</code>/<code>Ctrl-Q</code>/<code>Ctrl-L</code>/<code>F3</code>) is only a default. Rebind them in “host list <code>s</code> → settings → key bindings”: select a row, press Enter and hit the new key. Only F2–F9 or Ctrl/Alt combinations are accepted; a collision swaps the two actions automatically, effective immediately and saved to <code>settings.ini</code>. Note that EllS’ on-screen strings are Chinese-only by design.',
    'keys.tab.list': 'Host list', 'keys.tab.tabs': 'Tabs', 'keys.tab.session': 'Session', 'keys.tab.file': 'File browser', 'keys.tab.form': 'Host form',
    'k.list.move': 'Select a host', 'k.list.enter': 'Connect (or switch back to that tab if it’s already live)',
    'k.list.add': 'Add host', 'k.list.edit': 'Edit host', 'k.list.del': 'Delete (two-step confirm)',
    'k.list.set': 'Open settings', 'k.list.imp': 'Import <code>~/.ssh/config</code>',
    'k.list.help': 'Full key help page', 'k.list.quit': 'Quit',
    'k.list.note': 'Leading <code>●</code> = connected, <code>○</code> = connecting, <code>·</code> = idle; click a tab at the top to jump back to it.',
    'k.tabs.new': 'New tab', 'k.tabs.next': 'Next tab', 'k.tabs.prev': 'Previous tab',
    'k.tabs.close': 'Close the current tab (with one tab left it returns to the host list; while a transfer runs you must press twice)',
    'k.tabs.back': 'Return to the host list while keeping the connection; press again to go back to the same page',
    'k.tabs.mouse': 'Click a tab at the top to switch, click the trailing <code>+</code> for a new one',
    'k.session.raw': 'Any key goes straight to the remote', 'k.session.mode': 'Toggle embedded / passthrough',
    'k.session.sftp': 'Open the SFTP browser', 'k.session.redraw': 'Redraw',
    'k.session.search': 'Search scrollback (also <code>/</code> while scrolled back; <code>n</code>/<code>N</code> jump next/previous)',
    'k.session.wheel': 'Scroll history, colors preserved', 'k.session.drag': 'Copy selection (OSC 52)', 'k.session.help': 'Help',
    'k.session.note': 'The panel footer lists what your own terminal already claims: Windows Terminal takes <code>Ctrl+1–8</code> and <code>F11</code>; macOS treats function keys as media keys unless you hold <code>fn</code>; Option must be set as Meta for <code>Alt</code> combos; GNOME/KDE terminals occupy <code>F10</code>/<code>F11</code>.',
    'k.file.enter': 'Enter directory / download', 'k.file.up': 'Upload file', 'k.file.updir': 'Upload a whole directory',
    'k.file.down': 'Download', 'k.file.mkdir': 'New directory', 'k.file.rename': 'Rename',
    'k.file.delete': 'Delete (recursive, confirmed first)', 'k.file.cancel': 'Cancel all in-flight transfers',
    'k.file.refresh': 'Refresh', 'k.file.parent': 'Go up one level', 'k.file.back': 'Back to the terminal',
    'k.form.move': 'Move between fields', 'k.form.auth': 'Toggle auth method', 'k.form.key': 'Pick a private key',
    'k.form.jump': 'Pick a bastion', 'k.form.enter': 'On “key path / bastion”, opens the picker directly',
    'k.form.esc': 'Cancel in a dialog; <code>←→</code>/<kbd>Tab</kbd> switch options, <kbd>Enter</kbd> confirms',
    'k.form.note': 'Save via the Save button or Enter; the key passphrase field is only for keys that are themselves encrypted.',
    'keys.theme': 'Colors are configurable too: “host list <code>s</code> → settings → UI theme” cycles four themes with Enter or <code>←→</code> — <strong>dark (hard-painted background)</strong> black background with gray bands, the closest match on Windows; <strong>follow terminal (no background painted)</strong> defers bottom and body colors to your terminal’s own theme (recommended on macOS Terminal / iTerm2 / WezTerm, and the macOS default); <strong>high contrast</strong> drops the gray small print and uses bold/reverse for hierarchy; <strong>light</strong> is dark-on-light for white-background terminals. Preview is instant; Save writes <code>theme=</code> into <code>settings.ini</code>.',

    'faq.h2': 'FAQ',
    'faq.q1': 'What if I forget the master password?',
    'faq.a1': 'There is no recovery path — EllS offers none and never sends the password anywhere. You can only reset the vault and re-enter every host and credential, which is exactly why that warning sits at the top of the first-run screen. If typing it every time is a hassle, turn master password protection off in settings and use auto-unlock (credentials remain encrypted at rest in the local <code>vault.bin</code> with Argon2id + XChaCha20Poly1305).',
    'faq.q2': 'Where are credentials stored — and are they ever uploaded?',
    'faq.a2': 'Only in <code>~/.ells/vault.bin</code> on your machine. Keys are derived with Argon2id and sealed with XChaCha20Poly1305 authenticated encryption. Zero telemetry: no analytics, no reporting; the only outbound call is a HEAD request to GitHub’s release page for the version check.',
    'faq.q3': 'Does highlighting override colors the program emitted itself?',
    'faq.a3': 'No. Highlighting only applies to cells with the default foreground; any ANSI color the program sent is kept. You can also switch it off wholesale (“terminal output highlighting”). Detection is deliberately narrow: docker ps only matches a line starting with exactly a 12-character (or 64-character with <code>--no-trunc</code>) lowercase hex ID, so git’s 7–8 character short hashes aren’t tinted; for image versions only the colon after the last <code>/</code> counts, so the port in <code>registry.corp.com:5000/pay/app:2.1</code> is never mistaken for a tag.',
    'faq.q4': 'Do I need lrzsz on the remote side?',
    'faq.a4': 'No server-side cooperation required. EllS detects the ZMODEM handshake in the remote output stream and reroutes the sz/rz intent over SFTP, so you get the Xshell-feeling “type sz, a dialog appears” workflow with a genuine progress bar and native OS file dialogs.',
    'faq.q5': 'A full-screen program renders wrong in the embedded terminal. Now what?',
    'faq.a5': 'Press <code>Ctrl-L</code> to redraw first. If it’s still off, press <code>Ctrl-Q</code> for passthrough mode: EllS stops interpreting the byte stream and hands the terminal to the remote program untouched — an intentional escape hatch. Note that in passthrough the remote owns the screen; to reach the host list, press <code>Ctrl-Q</code> to return to embedded mode first.',
    'faq.q6': 'Why Windows Terminal / iTerm2 specifically?',
    'faq.a6': 'Legacy conhost handles mouse events and OSC 52 clipboard poorly, and macOS Terminal.app doesn’t support OSC 52 at all (drag-select copy stops working). Also, EllS’ window and tab titles track the current page (<code>ells-&lt;alias&gt;</code> once connected), which shows best in terminals that support it.',
    'faq.q7': 'What about Linux aarch64, or a machine with no desktop at all?',
    'faq.a7': 'aarch64 has no prebuilt asset: build from source (<code>cargo build --release -p ells</code>). In-app updates won’t attempt self-replacement there and point you at the installer instead. Without a desktop session the native file dialog can’t appear — especially in a headless TTY. SSH itself and file transfer via the SFTP shortcuts are unaffected.',
    'faq.q8': 'Install or update failing — what should I look at first?',
    'faq.a8': 'Run <code>sh diagnose.sh</code>: it prints how your shell, curl, architecture and proxy were resolved. <code>ells --check-update</code> only queries the version, prints the result and exits — handy for scripts and troubleshooting. <code>ELLS_LOG=1</code> sends internal logs to stderr, <code>ELLS_ZMODEM_LOG=1</code> writes sz/rz interception diagnostics to <code>~/.ells/zmodem.log</code>. When reporting an issue, upgrade to the latest release first and strip host addresses, paths and usernames from the logs.',
    'faq.q9': 'Is EllS production-ready?',
    'faq.a9': 'It’s still early: v0.1.x, bugs possible, features incomplete — issues welcome. Host key TOFU, prebuilt packages for three platforms, multi-session tabs, the theme layer and in-app updates have all landed; ssh-agent auth is on the roadmap (password and private keys, including key passphrases, work today). Per-release details are in the CHANGELOG.',

    'end.h': 'Three minutes to install, one terminal for every server',
    'end.p': 'MIT licensed · single binary · no telemetry · Windows / macOS / Linux.',
    'end.cta1': 'Install now',

    'foot.tag': 'A lightweight, cross-platform SSH client that lives in your terminal.',
    'foot.early': 'Early release v0.1.x: bugs possible, features still incomplete.',
    'foot.h.doc': 'Docs', 'foot.l.install': 'Install', 'foot.l.usage': 'Usage', 'foot.l.keys': 'Shortcuts', 'foot.l.screens': 'Screens',
    'foot.h.code': 'Code & releases', 'foot.l.releases': 'Releases',
    'foot.h.safe': 'Security & license', 'foot.l.sec': 'Security policy (private disclosure)', 'foot.l.issue': 'Report a bug / request a feature',
    'foot.copy': 'This page is a plain static site with no tracking and no cookies. The screenshots are faithful reproductions with every real address removed.'
  };

  var EN_ATTR = {
    'hero.copy': { 'aria-label': 'Copy the install command' }
  };

  /* ---------------- 状态 ---------------- */
  var originals = {};
  var attrOriginals = {};
  var lang = 'zh';
  var detected = null;   // 'windows' | 'macos' | 'linux' | null
  var picked = null;     // 用户手动选的平台
  var installPicked = null;

  /* ---------------- 工具 ---------------- */
  function L(zh, en) { return lang === 'zh' ? zh : en; }

  // 没存过偏好就跟着浏览器语言走：中文系统出中文，其余出英文。
  function systemLang() {
    var list = navigator.languages || [];
    var tag = (list[0] || navigator.language || navigator.userLanguage || 'en').toLowerCase();
    return tag.indexOf('zh') === 0 ? 'zh' : 'en';
  }

  function readSavedLang() {
    try {
      var saved = localStorage.getItem('ells-lang');
      if (saved === 'en' || saved === 'zh') return saved;
    } catch (e) { /* 隐私模式下 localStorage 会抛 */ }
    return systemLang();
  }

  function saveLang() {
    try { localStorage.setItem('ells-lang', lang); } catch (e) {}
  }

  function detectOs() {
    var uaData = navigator.userAgentData || null;
    var platform = (uaData && typeof uaData.platform === 'string')
      ? uaData.platform
      : (navigator.platform || '');
    var hay = (platform + ' ' + navigator.userAgent + ' ' + (navigator.vendor || '')).toLowerCase();

    if (/windows|win32|win64|cygwin|mingw/.test(hay)) return 'windows';
    if (/mac|iphone|ipad|ipod/.test(hay)) return 'macos';
    if (/linux|android|x11|cros/.test(hay)) return 'linux';
    return null;
  }

  function archHint() {
    var uaData = navigator.userAgentData || null;
    var arch = uaData && uaData.architecture ? String(uaData.architecture) : '';
    if (!arch) {
      var ua = navigator.userAgent.toLowerCase();
      if (/aarch64|arm64/.test(ua)) arch = 'arm64';
      else if (/x86_64|win64|x64/.test(ua)) arch = 'x64';
    }
    return arch === 'x64' ? 'x86_64' : arch;
  }

  function osBits() {
    var bits = [];
    var arch = archHint();
    if (arch) bits.push(arch);
    if (detected === 'windows' && /windows nt ([\d.]+)/i.test(navigator.userAgent)) {
      bits.push('NT ' + RegExp.$1);
    } else if (detected === 'macos') {
      var v = (navigator.userAgentData && navigator.userAgentData.platformVersion) || '';
      bits.push(v ? 'macOS ' + v : 'universal');
    } else if (detected === 'linux') {
      bits.push('Linux');
    }
    return bits.join(' · ');
  }

  function chosenHeroOs() { return picked || detected || 'windows'; }

  /* ---------------- i18n ---------------- */
  function applyLang() {
    var nodes = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < nodes.length; i++) {
      var key = nodes[i].getAttribute('data-i18n');
      var en = EN[key];
      nodes[i].innerHTML = (lang === 'en' && en) ? en : originals[key];
    }

    var attrNodes = document.querySelectorAll('[data-i18n-attr]');
    for (var a = 0; a < attrNodes.length; a++) {
      var spec = attrNodes[a].getAttribute('data-i18n-attr').split(':');
      var k = spec[1];
      var table = EN_ATTR[k];
      if (table && table[spec[0]]) attrNodes[a].setAttribute(spec[0], table[spec[0]]);
      else if (attrOriginals[k]) attrNodes[a].setAttribute(spec[0], attrOriginals[k]);
    }

    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    document.title = lang === 'en' ? 'EllS · A lightweight cross-platform SSH client for your terminal' : ZH_TITLE;
    var md = document.querySelector('meta[name="description"]');
    if (md) md.setAttribute('content', lang === 'en' ? EN_DESC : ZH_DESC);

    var toggle = document.getElementById('lang-toggle');
    if (toggle) toggle.textContent = lang === 'zh' ? 'EN' : '中文';

    renderHero();
    renderInstallPane();
  }

  var EN_DESC = 'EllS is an all-in-one terminal SSH client written in Rust: a real vt100 emulator inside a TUI, an encrypted credential vault, SFTP browsing, Xshell-style sz/rz transfer interception, multi-session tabs and in-app updates. Windows, macOS and Linux, installed with one line.';

  /* ---------------- hero ---------------- */
  function renderHero() {
    var os = chosenHeroOs();
    var label = document.getElementById('osbox-label');
    var bits = document.getElementById('osbox-bits');
    var cmdText = document.getElementById('cmd-text');
    var note = document.getElementById('cmd-shell-note');

    if (label) {
      label.innerHTML = detected
        ? L('已识别为 <b>{os}</b>，已给出推荐命令：', 'Detected <b>{os}</b> — recommended command:').replace('{os}', OS_NAME[detected])
        : L('未能识别你的系统，点上面的标签选一个：', 'Could not detect your system — pick a tab above:');
    }
    if (bits) bits.textContent = detected ? osBits() : '';
    if (cmdText) cmdText.textContent = CMD[os];
    if (note) note.textContent = SHELL_NOTE[os][lang];

    setActive('.os-tab', 'data-os', os);
    markDetected(detected);
  }

  // 在自动识别到的那个平台标签上点一个黄点，让人知道这不是随手选的
  function markDetected(os) {
    var els = document.querySelectorAll('.os-tab, [data-seg="install"] .seg-btn');
    for (var i = 0; i < els.length; i++) {
      els[i].classList.toggle('is-detected', !!os && els[i].getAttribute('data-os') === os);
    }
  }

  function setActive(selector, attr, value) {
    var els = document.querySelectorAll(selector);
    for (var i = 0; i < els.length; i++) {
      els[i].classList.toggle('is-on', els[i].getAttribute(attr) === value);
      if (els[i].getAttribute('role') === 'tab') els[i].setAttribute('aria-selected', els[i].getAttribute(attr) === value ? 'true' : 'false');
    }
  }

  function renderInstallPane() {
    var os = installPicked || picked || detected || 'windows';
    var panes = document.querySelectorAll('.pane');
    for (var i = 0; i < panes.length; i++) {
      panes[i].classList.toggle('is-on', panes[i].getAttribute('data-os') === os);
    }
    var seg = document.querySelector('[data-seg="install"]');
    if (seg) {
      var btns = seg.querySelectorAll('.seg-btn');
      for (var j = 0; j < btns.length; j++) {
        btns[j].classList.toggle('is-on', btns[j].getAttribute('data-os') === os);
      }
    }
  }

  /* ---------------- 复制 ---------------- */
  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText && window.isSecureContext) {
      return navigator.clipboard.writeText(text).catch(function () { return legacyCopy(text); });
    }
    return legacyCopy(text);
  }

  function legacyCopy(text) {
    return new Promise(function (resolve, reject) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', 'readonly');
      ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px';
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      document.body.removeChild(ta);
      ok ? resolve() : reject(new Error('copy failed'));
    });
  }

  function markCopied(el, restoreText) {
    el.classList.add('done');
    el.textContent = L('已复制', 'Copied');
    setTimeout(function () {
      el.textContent = restoreText;
      el.classList.remove('done');
    }, 1500);
  }

  /* ---------------- 启动 ---------------- */
  document.addEventListener('DOMContentLoaded', function () {
    document.documentElement.classList.remove('no-js');
    detected = detectOs();
    lang = readSavedLang();

    var nodes = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < nodes.length; i++) {
      var key = nodes[i].getAttribute('data-i18n');
      if (!(key in originals)) originals[key] = nodes[i].innerHTML;
    }

    var attrNodes = document.querySelectorAll('[data-i18n-attr]');
    for (var a = 0; a < attrNodes.length; a++) {
      var spec = attrNodes[a].getAttribute('data-i18n-attr').split(':');
      if (spec.length === 2 && !(spec[1] in attrOriginals)) {
        attrOriginals[spec[1]] = attrNodes[a].getAttribute(spec[0]) || '';
      }
    }

    // 所有代码块挂一个复制按钮
    var codes = document.querySelectorAll('.code[data-copy] code');
    for (var c = 0; c < codes.length; c++) {
      (function (codeEl) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'copy-inline';
        btn.textContent = 'copy';
        btn.addEventListener('click', function () {
          copyText(codeEl.textContent).then(function () { markCopied(btn, 'copy'); });
        });
        codeEl.parentNode.appendChild(btn);
      })(codes[c]);
    }

    // hero 平台标签（手动选）
    var heroTabs = document.querySelectorAll('.os-tab');
    for (var h = 0; h < heroTabs.length; h++) {
      heroTabs[h].addEventListener('click', function () {
        picked = this.getAttribute('data-os');
        installPicked = null;
        renderHero();
        renderInstallPane();
      });
    }

    // 安装区平台分段
    var installSeg = document.querySelector('[data-seg="install"]');
    if (installSeg) {
      installSeg.addEventListener('click', function (e) {
        var btn = e.target.closest ? e.target.closest('.seg-btn') : null;
        if (!btn) return;
        installPicked = btn.getAttribute('data-os');
        renderInstallPane();
      });
    }

    // 快捷键分页
    var keySeg = document.querySelector('[data-seg="keys"]');
    if (keySeg) {
      keySeg.addEventListener('click', function (e) {
        var btn = e.target.closest ? e.target.closest('.seg-btn') : null;
        if (!btn) return;
        var id = btn.getAttribute('data-pane');
        var btns = keySeg.querySelectorAll('.seg-btn');
        for (var i = 0; i < btns.length; i++) btns[i].classList.toggle('is-on', btns[i] === btn);
        var panes = document.querySelectorAll('.kpane');
        for (var j = 0; j < panes.length; j++) panes[j].classList.toggle('is-on', panes[j].id === id);
      });
    }

    // hero 主命令复制
    var copyBtn = document.getElementById('cmd-copy');
    if (copyBtn) {
      copyBtn.addEventListener('click', function () {
        var span = copyBtn.querySelector('span') || copyBtn;
        var restore = originals['hero.copy'] || '复制';
        copyText(CMD[chosenHeroOs()]).then(function () {
          copyBtn.classList.add('done');
          span.textContent = L('已复制', 'Copied');
          setTimeout(function () {
            span.textContent = lang === 'en' && EN['hero.copy'] ? EN['hero.copy'] : restore;
            copyBtn.classList.remove('done');
          }, 1500);
        });
      });
    }

    // 语言切换
    var toggle = document.getElementById('lang-toggle');
    if (toggle) {
      toggle.addEventListener('click', function () {
        lang = lang === 'zh' ? 'en' : 'zh';
        saveLang();
        applyLang();
      });
    }

    applyLang();
  });
})();
