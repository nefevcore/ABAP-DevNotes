# 切换到脚本所在目录
Set-Location $PSScriptRoot

# 设置根目录
$root = "docs"

# 获取所有 .md 文件（排除已经是 index.md 的）
Get-ChildItem -Path $root -Recurse -Filter "*.md" | Where-Object { 
    $_.Name -ne "index.md" 
} | ForEach-Object {
    $file = $_
    $parentDir = $file.Directory.FullName
    $newDirName = $file.BaseName
    $newDirPath = Join-Path $parentDir $newDirName
    $newFilePath = Join-Path $newDirPath "index.md"
    
    # 创建新目录
    if (-not (Test-Path $newDirPath)) {
        New-Item -ItemType Directory -Path $newDirPath -Force | Out-Null
    }
    
    # 移动文件
    Move-Item -Path $file.FullName -Destination $newFilePath -Force
    Write-Host "移动: $($file.Name) -> $newDirName\index.md"
}

Write-Host "完成！"
Read-Host "按回车键退出"