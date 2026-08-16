@echo off
setlocal EnableExtensions

rem 使用 UTF-8 显示中文，并始终从脚本所在的 Worldform 仓库根目录启动。
chcp 65001 >nul
cd /d "%~dp0"
title 万类 Worldform 编辑器

echo.
echo ========================================
echo   万类 Worldform 编辑器一键启动
echo ========================================
echo.

rem Worldform 要求 Node.js 20.9.0 或更高版本，启动前先给出明确诊断。
where node >nul 2>nul
if errorlevel 1 (
  echo [错误] 未找到 Node.js，请先安装 Node.js 20.9.0 或更高版本。
  goto :failed
)

node -e "const [major, minor] = process.versions.node.split('.').map(Number); process.exit(major > 20 || (major === 20 && minor >= 9) ? 0 : 1)"
if errorlevel 1 (
  for /f "delims=" %%V in ('node --version') do echo [错误] 当前 Node.js 版本为 %%V，Worldform 至少需要 20.9.0。
  goto :failed
)

rem 优先使用系统 pnpm；未安装时使用 Node.js 自带的 Corepack 运行 pnpm。
where pnpm >nul 2>nul
if not errorlevel 1 (
  set "WORLDFORM_PNPM=pnpm"
) else (
  where corepack >nul 2>nul
  if errorlevel 1 (
    echo [错误] 未找到 pnpm 或 Corepack，请先安装 pnpm。
    goto :failed
  )
  set "WORLDFORM_PNPM=corepack pnpm"
)

echo [1/2] 正在按 pnpm-lock.yaml 同步工程依赖……
call %WORLDFORM_PNPM% install --frozen-lockfile
if errorlevel 1 (
  echo [错误] 工程依赖安装失败，请检查上方输出。
  goto :failed
)

echo.
echo [2/2] 正在启动万类编辑器……
echo 浏览器会在服务就绪后自动打开；按 Ctrl+C 可停止服务。
echo.
rem --no-open 仅供自动验收使用；用户双击时默认自动打开浏览器。
if /i "%~1"=="--no-open" (
  call %WORLDFORM_PNPM% --filter @worldform/editor-host dev
) else (
  call %WORLDFORM_PNPM% --filter @worldform/editor-host dev -- --open
)
if errorlevel 1 (
  echo [错误] 编辑器服务异常退出，请检查上方输出。
  goto :failed
)

echo.
echo 万类编辑器已停止。
goto :end

:failed
echo.
pause
exit /b 1

:end
echo.
pause
exit /b 0
