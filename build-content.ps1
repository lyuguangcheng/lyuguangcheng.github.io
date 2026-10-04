# Generate content-bundle.js from content/*.md
#
# Why this exists:
#   When index.html is opened directly via file://, the browser blocks fetch()
#   for CORS reasons, so the site shows "Failed to load content".
#   Embedding the Markdown into a JS file makes file:// preview work.
#
# Usage: after adding or editing Markdown under content/, run once
#   powershell -ExecutionPolicy Bypass -File build-content.ps1
#
# Note: when the site is served over http(s) (including GitHub Pages), fetch()
#       works normally, so the live site stays correct even if you forget this.

$root = if ($PSScriptRoot) { $PSScriptRoot } else { (Get-Location).Path }
$contentDir = Join-Path $root 'content'
$outFile = Join-Path $root 'content-bundle.js'

if (-not (Test-Path $contentDir)) { throw "content directory not found: $contentDir" }

function ConvertTo-JsonStringLiteral([string]$s) {
    $sb = New-Object System.Text.StringBuilder
    [void]$sb.Append('"')
    foreach ($ch in $s.ToCharArray()) {
        $code = [int]$ch
        switch ($ch) {
            '"'  { [void]$sb.Append('\"'); continue }
            '\'  { [void]$sb.Append('\\'); continue }
            "`b" { [void]$sb.Append('\b'); continue }
            "`f" { [void]$sb.Append('\f'); continue }
            "`n" { [void]$sb.Append('\n'); continue }
            "`r" { [void]$sb.Append('\r'); continue }
            "`t" { [void]$sb.Append('\t'); continue }
            default {
                if ($code -lt 32 -or $code -eq 0x2028 -or $code -eq 0x2029) {
                    [void]$sb.Append('\u{0:x4}' -f $code)
                } else {
                    [void]$sb.Append($ch)
                }
            }
        }
    }
    [void]$sb.Append('"')
    $sb.ToString()
}

$files = @(Get-ChildItem -Path $contentDir -Filter '*.md' -File | Sort-Object Name)
if ($files.Count -eq 0) { throw "no .md files found under $contentDir" }

$entries = New-Object System.Collections.Generic.List[string]
foreach ($file in $files) {
    $text = [IO.File]::ReadAllText($file.FullName, [Text.Encoding]::UTF8) -replace "^\uFEFF", ''
    $text = $text -replace "`r`n", "`n"
    $key = 'content/' + $file.Name
    $entries.Add((ConvertTo-JsonStringLiteral $key) + ':' + (ConvertTo-JsonStringLiteral $text))
}

$json = '{' + ($entries -join ',') + '}'

$banner = @'
/* 本文件由 build-content.ps1 自动生成，请勿手动编辑。
   作用：内嵌 content/*.md 的正文，让站点以 file:// 直接打开时也能显示内容。
   更新方式：修改 content/ 下的 Markdown 后重新运行 powershell -File build-content.ps1 */
'@

$body = $banner + "`nwindow.LGC_CONTENT = " + $json + ";`n"
[IO.File]::WriteAllText($outFile, $body, (New-Object Text.UTF8Encoding($false)))

$kb = [Math]::Round((Get-Item $outFile).Length / 1KB, 1)
Write-Output ("Done. Bundled {0} markdown file(s) into content-bundle.js ({1} KB)." -f $files.Count, $kb)
