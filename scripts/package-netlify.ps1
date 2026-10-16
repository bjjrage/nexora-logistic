$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$siteRoot = Split-Path $PSScriptRoot -Parent
$deployRoot = (Resolve-Path (Join-Path $siteRoot 'dist')).Path
$archiveDirectory = Join-Path $siteRoot 'artifacts'
New-Item -ItemType Directory -Force -Path $archiveDirectory | Out-Null
$archivePath = Join-Path $archiveDirectory ('nexora-netlify-' + [Guid]::NewGuid().ToString('N') + '.zip')
$archive = [IO.Compression.ZipFile]::Open($archivePath, [IO.Compression.ZipArchiveMode]::Create)
try {
    Get-ChildItem -LiteralPath $deployRoot -File -Recurse -Force | ForEach-Object {
        $entryName = $_.FullName.Substring($deployRoot.Length + 1).Replace('\', '/')
        [IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive, $_.FullName, $entryName, [IO.Compression.CompressionLevel]::Optimal) | Out-Null
    }
} finally {
    $archive.Dispose()
}
Write-Output $archivePath
