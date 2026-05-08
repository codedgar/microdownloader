# Third-Party Licenses

Microdownloader is distributed as a packaged application (`.dmg`) that bundles
third-party software. This document lists those components and their licenses,
in compliance with each project's terms.

The Microdownloader source code itself is licensed under the MIT License — see
[LICENSE](./LICENSE).

---

## yt-dlp

- **Project:** https://github.com/yt-dlp/yt-dlp
- **License:** The Unlicense (public domain)
- **Bundled binary location:** `resources/bin/yt-dlp`

> This is free and unencumbered software released into the public domain.
>
> Anyone is free to copy, modify, publish, use, compile, sell, or distribute
> this software, either in source code form or as a compiled binary, for any
> purpose, commercial or non-commercial, and by any means.
>
> In jurisdictions that recognize copyright laws, the author or authors of
> this software dedicate any and all copyright interest in the software to
> the public domain. We make this dedication for the benefit of the public
> at large and to the detriment of our heirs and successors. We intend this
> dedication to be an overt act of relinquishment in perpetuity of all
> present and future rights to this software under copyright law.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
> IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
> FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
> AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
> ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
> WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
>
> For more information, please refer to <https://unlicense.org>

---

## FFmpeg

- **Project:** https://ffmpeg.org/
- **License:** GNU Lesser General Public License, version 2.1 or later (LGPL-2.1-or-later)
- **Bundled binary location:** `resources/bin/ffmpeg`
- **Source code:** Available at https://ffmpeg.org/download.html and
  https://git.ffmpeg.org/ffmpeg.git

The bundled `ffmpeg` binary is an unmodified build distributed under the LGPL.
Users who wish to replace it with their own build may do so by substituting the
binary at `Microdownloader.app/Contents/Resources/resources/bin/ffmpeg`.

The full text of the LGPL v2.1 is available at:
https://www.gnu.org/licenses/old-licenses/lgpl-2.1.html

> FFmpeg is free software; you can redistribute it and/or modify it under
> the terms of the GNU Lesser General Public License as published by the
> Free Software Foundation; either version 2.1 of the License, or (at your
> option) any later version.
>
> FFmpeg is distributed in the hope that it will be useful, but WITHOUT ANY
> WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
> FOR A PARTICULAR PURPOSE. See the GNU Lesser General Public License for
> more details.

---

## Electron

- **Project:** https://www.electronjs.org/
- **License:** MIT
- **Copyright:** Copyright (c) Electron contributors  
  Copyright (c) 2013-present GitHub Inc.

> Permission is hereby granted, free of charge, to any person obtaining a copy
> of this software and associated documentation files (the "Software"), to deal
> in the Software without restriction, including without limitation the rights
> to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
> copies of the Software, and to permit persons to whom the Software is
> furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in
> all copies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
> IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
> FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
> AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
> LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
> OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
> THE SOFTWARE.

Electron itself bundles Chromium and Node.js, whose licenses are included in
the Electron distribution at `Electron.app/Contents/Frameworks/...` and listed
at https://www.electronjs.org/.

---

## Notes

- If you redistribute Microdownloader (forks, mirrors, repackaged builds), you
  must continue to ship this file (or an equivalent) alongside the bundled
  binaries.
- If you replace the bundled `ffmpeg` binary with a GPL build (rather than
  LGPL), you must update this file accordingly and ensure your distribution
  complies with the GPL.
