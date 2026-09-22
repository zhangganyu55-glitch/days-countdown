#!/bin/zsh
# ============================================================
#  倒数日 · 手机预览启动器
#  双击这个文件，会在本机起一个小小的网页服务，
#  手机连同一个 Wi-Fi 就能打开倒数日。
#  看完在窗口里按 Control + C 停止。
# ============================================================

HERE="$(cd "$(dirname "$0")" && pwd)"

# 把页面复制成 index.html，这样地址栏里不用输中文文件名
SERVE_DIR="$(mktemp -d)"
cp "$HERE/倒数日.html" "$SERVE_DIR/index.html"

# 找本机在局域网里的地址
IP="$(ipconfig getifaddr en0 2>/dev/null)"
[ -z "$IP" ] && IP="$(ipconfig getifaddr en1 2>/dev/null)"
[ -z "$IP" ] && IP="127.0.0.1"

echo ""
echo "  手机上打开：  http://$IP:8000/"
echo "  这台电脑上：  http://127.0.0.1:8000/"
echo ""
echo "  手机需要和这台电脑连同一个 Wi-Fi。"
echo "  停止服务：在这个窗口按 Control + C"
echo ""

python3 -m http.server 8000 --bind 0.0.0.0 --directory "$SERVE_DIR"
