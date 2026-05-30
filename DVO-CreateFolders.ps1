# DVO-CreateFolders.ps1
# DVO 프로젝트 기본 폴더 구조 생성

$folders = @(
    "src\config",
    "src\game\core",
    "src\game\renderers",
    "src\lib\ui",
    "src\lib\game",
    "src\lib\player",
    "src\lib\action",
    "src\routes",
    "src\i18n",
    "src\locales\ko",
    "src\locales\en",
    "src\services",
    "src\stores",
    "src\types"
)

foreach ($folder in $folders) {
    New-Item -ItemType Directory -Path $folder -Force | Out-Null
    Write-Host "[OK] $folder"
}

Write-Host ""
Write-Host "DVO 폴더 구조 생성 완료"
