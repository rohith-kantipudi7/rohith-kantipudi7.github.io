# Generates PNG icons and the Open Graph image using System.Drawing.
# Run: powershell -NoProfile -ExecutionPolicy Bypass -File tools/make-assets.ps1
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$assets = Join-Path $root 'assets'
New-Item -ItemType Directory -Force -Path $assets | Out-Null

function New-RoundedRectPath([float]$x, [float]$y, [float]$w, [float]$h, [float]$r) {
    $p = New-Object System.Drawing.Drawing2D.GraphicsPath
    $d = $r * 2
    $p.AddArc($x, $y, $d, $d, 180, 90)
    $p.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
    $p.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90)
    $p.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
    $p.CloseFigure()
    return $p
}

function Draw-Icon([int]$size, [string]$outFile, [bool]$maskable) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias

    $c1 = [System.Drawing.Color]::FromArgb(0x10, 0x9c, 0x74)
    $c2 = [System.Drawing.Color]::FromArgb(0x0d, 0x73, 0x77)
    $grad = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        (New-Object System.Drawing.Point(0, 0)),
        (New-Object System.Drawing.Point($size, $size)), $c1, $c2)

    if ($maskable) {
        # maskable: fill the full square (safe zone handled by scaling glyphs inward)
        $g.FillRectangle($grad, 0, 0, $size, $size)
        $s = $size * 0.70; $off = ($size - $s) / 2
    } else {
        $radius = $size * 0.25
        $bgPath = New-RoundedRectPath 0 0 $size $size $radius
        $g.FillPath($grad, $bgPath)
        $s = $size * 0.86; $off = ($size - $s) / 2
    }

    # three white bars (x, yTop, height are fractions of the 32-unit design grid)
    $white = [System.Drawing.Brushes]::White
    $u = $s / 32.0
    foreach ($bar in @(@(7, 17, 8), @(14, 12, 13), @(21, 7, 18))) {
        $bx = $off + $bar[0] * $u
        $by = $off + $bar[1] * $u
        $bw = 4 * $u
        $bh = $bar[2] * $u
        $barPath = New-RoundedRectPath $bx $by $bw $bh (1.5 * $u)
        $g.FillPath($white, $barPath)
    }

    # orange average line
    $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(0xff, 0xb3, 0x40), (2 * $u))
    $pen.StartCap = 'Round'; $pen.EndCap = 'Round'
    $g.DrawLine($pen, [float]($off + 5 * $u), [float]($off + 15 * $u), [float]($off + 27 * $u), [float]($off + 15 * $u))

    $g.Dispose()
    $bmp.Save((Join-Path $assets $outFile), [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "wrote $outFile"
}

Draw-Icon 32  'icon-32.png'  $false
Draw-Icon 180 'icon-180.png' $false
Draw-Icon 192 'icon-192.png' $false
Draw-Icon 512 'icon-512.png' $false
Draw-Icon 512 'icon-maskable-512.png' $true

# ---------- Open Graph image 1200x630 ----------
$w = 1200; $h = 630
$bmp = New-Object System.Drawing.Bitmap($w, $h)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

# background: deep navy gradient
$bg1 = [System.Drawing.Color]::FromArgb(0x07, 0x1d, 0x1a)
$bg2 = [System.Drawing.Color]::FromArgb(0x0b, 0x2e, 0x2e)
$bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    (New-Object System.Drawing.Point(0, 0)), (New-Object System.Drawing.Point($w, $h)), $bg1, $bg2)
$g.FillRectangle($bgBrush, 0, 0, $w, $h)

# decorative bars on the right with average line
$barBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(90, 0x1b, 0xaf, 0x7a))
$barX = 820; $bw2 = 70; $gap = 30
$heights = @(180, 260, 340, 300, 420)
for ($i = 0; $i -lt $heights.Count; $i++) {
    $bh2 = $heights[$i]
    $bx2 = $barX + $i * ($bw2 + $gap)
    $p2 = New-RoundedRectPath $bx2 ($h - 60 - $bh2) $bw2 $bh2 8
    $g.FillPath($barBrush, $p2)
}
$avgPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(0xff, 0xb3, 0x40), 5)
$avgPen.StartCap = 'Round'; $avgPen.EndCap = 'Round'
$g.DrawLine($avgPen, 800, 330, 1180, 330)

# icon chip
$chip = New-RoundedRectPath 80 90 96 96 24
$chipBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    (New-Object System.Drawing.Point(80, 90)), (New-Object System.Drawing.Point(176, 186)),
    [System.Drawing.Color]::FromArgb(0x10, 0x9c, 0x74), [System.Drawing.Color]::FromArgb(0x0d, 0x73, 0x77))
$g.FillPath($chipBrush, $chip)
$u2 = 96 / 32.0
foreach ($bar in @(@(7, 17, 8), @(14, 12, 13), @(21, 7, 18))) {
    $p3 = New-RoundedRectPath (80 + $bar[0] * $u2) (90 + $bar[1] * $u2) (4 * $u2) ($bar[2] * $u2) (1.5 * $u2)
    $g.FillPath([System.Drawing.Brushes]::White, $p3)
}
$pen3 = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(0xff, 0xb3, 0x40), (2 * $u2))
$pen3.StartCap = 'Round'; $pen3.EndCap = 'Round'
$g.DrawLine($pen3, [float](80 + 5 * $u2), [float](90 + 15 * $u2), [float](80 + 27 * $u2), [float](90 + 15 * $u2))

# text
$titleFont = New-Object System.Drawing.Font('Segoe UI', 58, [System.Drawing.FontStyle]::Bold)
$subFont = New-Object System.Drawing.Font('Segoe UI', 26, [System.Drawing.FontStyle]::Regular)
$urlFont = New-Object System.Drawing.Font('Segoe UI', 20, [System.Drawing.FontStyle]::Regular)
$white = [System.Drawing.Brushes]::White
$grayBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(0xb9, 0xd2, 0xcc))
$accentBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(0x4e, 0xc9, 0xa4))

$g.DrawString('Stock Average', $titleFont, $white, 70, 240)
$g.DrawString('Calculator', $titleFont, $white, 70, 330)
$dash = [string][char]0x2014
$g.DrawString("Average your share price in seconds $dash free, private, offline.", $subFont, $grayBrush, 76, 452)
$g.DrawString('rohith-kantipudi7.github.io/Stock-Calculator', $urlFont, $accentBrush, 78, 540)

$g.Dispose()
$bmp.Save((Join-Path $assets 'og-image.png'), [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
Write-Host 'wrote og-image.png'
