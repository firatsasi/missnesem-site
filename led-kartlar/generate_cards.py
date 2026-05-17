# -*- coding: utf-8 -*-
"""Miss Nesem LED Ekran Kartlari - 880x1560px, ViPlex Express"""
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

import ctypes
import ctypes.wintypes as wintypes
import math
import os
import struct
import qrcode
from PIL import Image, ImageDraw, ImageFilter, ImageFont

# ── Sabitler ──────────────────────────────────────────────────────────────────
W, H = 880, 1560
OUT_DIR = os.path.dirname(os.path.abspath(__file__))

# Renk paleti
KREM   = (250, 247, 243)
ALTIN  = (184, 147, 74)
KOYU   = (26, 19, 10)
PUDRA  = (232, 208, 212)
BEYAZ  = (255, 255, 255)
KOYU2  = (40, 30, 18)
ALTIN2 = (210, 175, 100)

# Font yolları
FONTS = "C:/Windows/Fonts"
F_GARAMOND_B = f"{FONTS}/GARABD.TTF"
F_GARAMOND_R = f"{FONTS}/GARA.TTF"
F_GARAMOND_I = f"{FONTS}/GARAIT.TTF"
F_GEORGIA_B  = f"{FONTS}/georgiab.ttf"
F_GEORGIA    = f"{FONTS}/georgia.ttf"
F_SEGOE_B    = f"{FONTS}/segoeuib.ttf"
F_SEGOE      = f"{FONTS}/segoeui.ttf"
F_CALIBRI_B  = f"{FONTS}/calibrib.ttf"
F_TIMES_B    = f"{FONTS}/timesbd.ttf"

LOGO_PATH = os.path.join(os.path.dirname(OUT_DIR), "assets", "missnesem_logo_white.png")


# ── Windows GDI Arapça renderer ───────────────────────────────────────────────
def render_arabic_gdi(text, font_size, text_color=(26, 19, 10), bg_color=(250, 247, 243), max_width=800):
    """Windows GDI kullanarak Arapça/RTL metni doğru render eder."""
    gdi32  = ctypes.windll.gdi32
    user32 = ctypes.windll.user32

    # Device context
    screen_dc = user32.GetDC(None)
    mem_dc    = gdi32.CreateCompatibleDC(screen_dc)

    bmp_w, bmp_h = max_width, int(font_size * 2.2)
    bitmap = gdi32.CreateCompatibleBitmap(screen_dc, bmp_w, bmp_h)
    gdi32.SelectObject(mem_dc, bitmap)

    # Arka plan doldur
    bg_colorref = bg_color[0] | (bg_color[1] << 8) | (bg_color[2] << 16)
    brush = gdi32.CreateSolidBrush(bg_colorref)
    rect  = (ctypes.c_long * 4)(0, 0, bmp_w, bmp_h)
    user32.FillRect(mem_dc, rect, brush)
    gdi32.DeleteObject(brush)

    # Font oluştur
    LOGFONT_SIZE = 92
    lf = (ctypes.c_byte * LOGFONT_SIZE)()
    # lfHeight
    struct.pack_into('<i', lf, 0, -font_size)
    # lfWeight (700 = bold)
    struct.pack_into('<i', lf, 16, 700)
    # lfCharSet (178 = ARABIC_CHARSET)
    struct.pack_into('<B', lf, 23, 178)
    # lfFaceName offset 28, unicode
    face = "Segoe UI\0"
    for i, ch in enumerate(face):
        struct.pack_into('<H', lf, 28 + i * 2, ord(ch))

    font = gdi32.CreateFontIndirectA(lf)
    gdi32.SelectObject(mem_dc, font)

    # Metin rengi ve arka plan modu
    fg_colorref = text_color[0] | (text_color[1] << 8) | (text_color[2] << 16)
    gdi32.SetTextColor(mem_dc, fg_colorref)
    gdi32.SetBkColor(mem_dc, bg_colorref)
    gdi32.SetBkMode(mem_dc, 2)  # OPAQUE

    # RTL + Arapça için DT_RTLREADING | DT_RIGHT | DT_VCENTER | DT_SINGLELINE
    DT_SINGLELINE  = 0x0020
    DT_VCENTER     = 0x0004
    DT_RIGHT       = 0x0002
    DT_RTLREADING  = 0x00020000
    DT_CENTER      = 0x0001
    flags = DT_SINGLELINE | DT_VCENTER | DT_RIGHT | DT_RTLREADING

    text_rect = (ctypes.c_long * 4)(0, 0, bmp_w, bmp_h)
    # DrawTextW
    user32.DrawTextW(mem_dc, ctypes.c_wchar_p(text), -1, text_rect, flags)

    # Bitmap'i PIL'e aktar
    class BITMAPINFOHEADER(ctypes.Structure):
        _fields_ = [
            ('biSize', ctypes.c_uint32), ('biWidth', ctypes.c_int32),
            ('biHeight', ctypes.c_int32), ('biPlanes', ctypes.c_uint16),
            ('biBitCount', ctypes.c_uint16), ('biCompression', ctypes.c_uint32),
            ('biSizeImage', ctypes.c_uint32), ('biXPelsPerMeter', ctypes.c_int32),
            ('biYPelsPerMeter', ctypes.c_int32), ('biClrUsed', ctypes.c_uint32),
            ('biClrImportant', ctypes.c_uint32),
        ]

    bmi = BITMAPINFOHEADER()
    bmi.biSize      = ctypes.sizeof(BITMAPINFOHEADER)
    bmi.biWidth     = bmp_w
    bmi.biHeight    = -bmp_h  # top-down
    bmi.biPlanes    = 1
    bmi.biBitCount  = 32
    bmi.biCompression = 0

    buf = (ctypes.c_byte * (bmp_w * bmp_h * 4))()
    gdi32.GetDIBits(mem_dc, bitmap, 0, bmp_h, buf, ctypes.byref(bmi), 0)

    img = Image.frombytes('RGBA', (bmp_w, bmp_h), bytes(buf), 'raw', 'BGRA')

    # Temizle
    gdi32.DeleteObject(font)
    gdi32.DeleteObject(bitmap)
    gdi32.DeleteDC(mem_dc)
    user32.ReleaseDC(None, screen_dc)

    # Sıkı kırp
    bbox = img.convert('RGB').getbbox()
    if bbox:
        img = img.crop(bbox)
    return img.convert('RGBA')


# ── Yardımcı fonksiyonlar ─────────────────────────────────────────────────────
def fnt(path, size):
    try:
        return ImageFont.truetype(path, size)
    except Exception:
        return ImageFont.load_default()


def text_w(draw, text, font):
    bb = draw.textbbox((0, 0), text, font=font)
    return bb[2] - bb[0]


def centered_text(draw, y, text, font, color, img_w=W):
    tw = text_w(draw, text, font)
    draw.text(((img_w - tw) // 2, y), text, font=font, fill=color)
    return draw.textbbox((0, y), text, font=font)[3] - y


def text_h(draw, text, font):
    bb = draw.textbbox((0, 0), text, font=font)
    return bb[3] - bb[1]


def gold_line(draw, y, margin=80):
    draw.rectangle([margin, y, W - margin, y + 2], fill=ALTIN)


def load_logo(bg_is_dark=True, target_w=380):
    """Beyaz logoyu yükle; açık arka plan için koyu renge çevir."""
    logo = Image.open(LOGO_PATH).convert("RGBA")
    ratio = target_w / logo.width
    logo = logo.resize((target_w, int(logo.height * ratio)), Image.LANCZOS)
    if not bg_is_dark:
        # Beyaz pikselleri altın/koyu renge çevir
        r, g, b, a = logo.split()
        dark = Image.new('RGBA', logo.size, KOYU)
        dark.putalpha(a)
        logo = dark
    return logo


def paste_logo(canvas, logo, cx, cy):
    x = cx - logo.width // 2
    y = cy - logo.height // 2
    canvas.paste(logo, (x, y), logo)
    return y + logo.height  # bottom edge


def marble_bg():
    """Krem zemin + ince marble texture."""
    img = Image.new('RGB', (W, H), KREM)
    draw = ImageDraw.Draw(img)
    # Subtle vein lines
    import random
    rng = random.Random(42)
    for _ in range(18):
        x0 = rng.randint(0, W)
        y0 = rng.randint(0, H)
        dx = rng.randint(-300, 300)
        dy = rng.randint(100, 400)
        alpha = rng.randint(8, 22)
        c = tuple(max(0, v - 15) for v in KREM)
        draw.line([(x0, y0), (x0 + dx, y0 + dy)], fill=c, width=1)
    img = img.filter(ImageFilter.GaussianBlur(0.4))
    return img


def dark_bg():
    img = Image.new('RGB', (W, H), KOYU2)
    draw = ImageDraw.Draw(img)
    # gold gradient strip top
    for i in range(60):
        alpha = int(80 * (1 - i / 60))
        draw.line([(0, i), (W, i)], fill=tuple(c + (255 - alpha) * (255 - c) // 255 for c in ALTIN))
    return img


def paste_arabic(canvas, text, font_size, y, color=KOYU, bg=KREM, max_w=750):
    """GDI ile render edilmiş Arapça metni ortala ve yapıştır."""
    ar_img = render_arabic_gdi(text, font_size, color, bg, max_w)
    x = (W - ar_img.width) // 2
    # RGBA üzerine yapıştır
    tmp = Image.new('RGBA', ar_img.size, (0, 0, 0, 0))
    canvas_rgba = canvas.convert('RGBA')
    canvas_rgba.paste(ar_img, (x, y))
    result = canvas_rgba.convert('RGB')
    canvas.paste(result)
    return ar_img.height


# ── KART 1: Marka Kartı ───────────────────────────────────────────────────────
def kart1_marka():
    img = marble_bg()
    draw = ImageDraw.Draw(img)

    # Üst gold bar
    draw.rectangle([0, 0, W, 8], fill=ALTIN)
    draw.rectangle([0, H - 8, W, H], fill=ALTIN)

    # Logo
    logo = load_logo(bg_is_dark=False, target_w=420)
    paste_logo(img, logo, W // 2, 230)

    # Divider
    gold_line(draw, 420)

    # Slogan blok - TR
    y = 460
    f_title = fnt(F_GARAMOND_B, 90)
    f_sub   = fnt(F_GEORGIA_B, 68)
    f_en    = fnt(F_SEGOE_B, 65)
    f_ru    = fnt(F_SEGOE_B, 62)

    # TR
    draw.text(((W - text_w(draw, "Toptan Kadın Giyim", f_title)) // 2, y),
              "Toptan Kadın Giyim", font=f_title, fill=ALTIN)
    y += 115

    # EN
    draw.text(((W - text_w(draw, "Wholesale Women's Fashion", f_en)) // 2, y),
              "Wholesale Women's Fashion", font=f_en, fill=KOYU)
    y += 95

    gold_line(draw, y + 15)
    y += 50

    # AR (GDI)
    ar_text = "تجارة الجملة للملابس النسائية"
    h = paste_arabic(img, ar_text, 68, y, color=KOYU, bg=KREM)
    draw = ImageDraw.Draw(img)
    y += h + 30

    # RU
    ru = "Оптовая женская одежда"
    draw.text(((W - text_w(draw, ru, f_ru)) // 2, y), ru, font=f_ru, fill=KOYU)
    y += 100

    gold_line(draw, y + 10)

    # Alt: missnesem.com
    f_url = fnt(F_GARAMOND_B, 88)
    url   = "missnesem.com"
    draw.text(((W - text_w(draw, url, f_url)) // 2, H - 180),
              url, font=f_url, fill=ALTIN)

    draw.rectangle([0, H - 8, W, H], fill=ALTIN)
    img.save(os.path.join(OUT_DIR, "marka-karti.png"), dpi=(150, 150))
    print("✓ marka-karti.png")


# ── KART 2: Haftasonu / Kapalı ────────────────────────────────────────────────
def kart2_haftasonu():
    img = dark_bg()
    draw = ImageDraw.Draw(img)

    draw.rectangle([0, 0, W, 8], fill=ALTIN)
    draw.rectangle([0, H - 8, W, H], fill=ALTIN)

    # Logo (beyaz, koyu arka plan)
    logo = load_logo(bg_is_dark=True, target_w=300)
    paste_logo(img, logo, W // 2, 180)
    draw = ImageDraw.Draw(img)

    gold_line(draw, 330)

    # Ana mesaj
    f_big  = fnt(F_GARAMOND_B, 130)
    f_mid  = fnt(F_SEGOE_B, 72)
    f_sub  = fnt(F_SEGOE_B, 64)

    y = 390
    msg_tr = "ŞU AN"
    msg_tr2 = "KAPALIYIZ"
    draw.text(((W - text_w(draw, msg_tr, f_big)) // 2, y), msg_tr, font=f_big, fill=ALTIN)
    y += 155
    draw.text(((W - text_w(draw, msg_tr2, f_big)) // 2, y), msg_tr2, font=f_big, fill=ALTIN)
    y += 165

    gold_line(draw, y)
    y += 40

    msg_en = "WE'RE CLOSED NOW"
    draw.text(((W - text_w(draw, msg_en, f_mid)) // 2, y), msg_en, font=f_mid, fill=BEYAZ)
    y += 110

    gold_line(draw, y)
    y += 55

    # WhatsApp bölümü - kutu
    box_y = y
    draw.rounded_rectangle([60, box_y, W - 60, box_y + 230], radius=20, fill=ALTIN)
    f_wa = fnt(F_SEGOE_B, 62)
    wa1  = "WhatsApp Her Zaman Açık!"
    wa2  = "WhatsApp Always Open!"
    draw.text(((W - text_w(draw, wa1, f_wa)) // 2, box_y + 25), wa1, font=f_wa, fill=KOYU)
    draw.text(((W - text_w(draw, wa2, f_wa)) // 2, box_y + 110), wa2, font=f_wa, fill=KOYU)

    # Alt numara
    f_num = fnt(F_SEGOE_B, 70)
    num   = "+90 530 850 42 21"
    draw.text(((W - text_w(draw, num, f_num)) // 2, H - 180),
              num, font=f_num, fill=ALTIN)

    img.save(os.path.join(OUT_DIR, "haftasonu-karti.png"), dpi=(150, 150))
    print("✓ haftasonu-karti.png")


# ── KART 3: QR WhatsApp ───────────────────────────────────────────────────────
def kart3_qr():
    img = marble_bg()
    draw = ImageDraw.Draw(img)

    draw.rectangle([0, 0, W, 8], fill=ALTIN)
    draw.rectangle([0, H - 8, W, H], fill=ALTIN)

    # Logo
    logo = load_logo(bg_is_dark=False, target_w=280)
    paste_logo(img, logo, W // 2, 155)
    draw = ImageDraw.Draw(img)

    f_title = fnt(F_GARAMOND_B, 72)
    f_sub   = fnt(F_SEGOE_B, 58)

    gold_line(draw, 295)

    y = 330
    t1 = "Bizimle İletişime Geç"
    draw.text(((W - text_w(draw, t1, f_title)) // 2, y), t1, font=f_title, fill=KOYU)
    y += 95
    t2 = "Get in Touch"
    draw.text(((W - text_w(draw, t2, f_sub)) // 2, y), t2, font=f_sub, fill=ALTIN)
    y += 85

    gold_line(draw, y)
    y += 30

    # QR kod üret
    wa_url = "https://wa.me/905308504221?text=Merhaba%20Miss%20Ne%C5%9Fem%2C%20koleksiyonu%20g%C3%B6rmek%20istiyorum"
    qr = qrcode.QRCode(version=None, error_correction=qrcode.constants.ERROR_CORRECT_H,
                       box_size=12, border=2)
    qr.add_data(wa_url)
    qr.make(fit=True)
    qr_img = qr.make_image(fill_color=KOYU, back_color=KREM).convert('RGB')
    # QR boyutlandır ~620px
    qr_size = 630
    qr_img = qr_img.resize((qr_size, qr_size), Image.NEAREST)

    # Altın çerçeve
    frame_pad = 16
    draw.rounded_rectangle(
        [W // 2 - qr_size // 2 - frame_pad - 4,
         y - frame_pad - 4,
         W // 2 + qr_size // 2 + frame_pad + 4,
         y + qr_size + frame_pad + 4],
        radius=18, fill=ALTIN
    )
    draw.rounded_rectangle(
        [W // 2 - qr_size // 2 - frame_pad,
         y - frame_pad,
         W // 2 + qr_size // 2 + frame_pad,
         y + qr_size + frame_pad],
        radius=14, fill=KREM
    )
    img.paste(qr_img, (W // 2 - qr_size // 2, y))
    draw = ImageDraw.Draw(img)

    y += qr_size + frame_pad + 30
    gold_line(draw, y)
    y += 40

    f_scan = fnt(F_SEGOE_B, 66)
    s1 = "Telefonunla Tara"
    s2 = "Scan with Your Phone"
    draw.text(((W - text_w(draw, s1, f_scan)) // 2, y), s1, font=f_scan, fill=KOYU)
    y += 90
    draw.text(((W - text_w(draw, s2, f_scan)) // 2, y), s2, font=f_scan, fill=ALTIN)

    img.save(os.path.join(OUT_DIR, "qr-whatsapp.png"), dpi=(150, 150))
    print("✓ qr-whatsapp.png")


# ── KART 4: Ürün Çerçevesi (Template) ────────────────────────────────────────
def kart4_urun_cerceve():
    img = marble_bg()
    draw = ImageDraw.Draw(img)

    draw.rectangle([0, 0, W, 8], fill=ALTIN)
    draw.rectangle([0, H - 8, W, H], fill=ALTIN)

    # Sol üst logo
    logo = load_logo(bg_is_dark=False, target_w=200)
    img.paste(logo, (40, 30), logo)
    draw = ImageDraw.Draw(img)

    gold_line(draw, 145)

    # Ürün alanı çerçeve
    px1, py1, px2, py2 = 60, 170, W - 60, 1280
    draw.rounded_rectangle([px1 - 4, py1 - 4, px2 + 4, py2 + 4], radius=20, fill=ALTIN)
    draw.rounded_rectangle([px1, py1, px2, py2], radius=16, fill=(240, 235, 228))

    # "ÜRÜN FOTOĞRAFI" placeholder yazısı
    f_ph = fnt(F_GARAMOND_I, 64)
    ph   = "ÜRÜN FOTOĞRAFI"
    draw.text(((W - text_w(draw, ph, f_ph)) // 2, (py1 + py2) // 2 - 40),
              ph, font=f_ph, fill=(180, 160, 140))

    gold_line(draw, 1300)

    # Alt bar
    f_url = fnt(F_GARAMOND_B, 72)
    draw.text(((W - text_w(draw, "missnesem.com", f_url)) // 2, 1330),
              "missnesem.com", font=f_url, fill=ALTIN)

    # WhatsApp ikonu - basit baloncuk
    f_wa = fnt(F_SEGOE_B, 55)
    wa   = "+90 530 850 42 21"
    draw.text(((W - text_w(draw, wa, f_wa)) // 2, 1420),
              wa, font=f_wa, fill=KOYU)

    img.save(os.path.join(OUT_DIR, "urun-cerceve.png"), dpi=(150, 150))
    print("✓ urun-cerceve.png")


# ── KART 5: İletişim Kartı ────────────────────────────────────────────────────
def kart5_iletisim():
    img = marble_bg()
    draw = ImageDraw.Draw(img)

    draw.rectangle([0, 0, W, 8], fill=ALTIN)
    draw.rectangle([0, H - 8, W, H], fill=ALTIN)

    logo = load_logo(bg_is_dark=False, target_w=340)
    paste_logo(img, logo, W // 2, 185)
    draw = ImageDraw.Draw(img)

    gold_line(draw, 355)

    f_head = fnt(F_GARAMOND_B, 80)
    f_addr = fnt(F_GEORGIA_B, 76)
    f_sub  = fnt(F_SEGOE_B, 68)

    y = 400
    adres = "İLETİŞİM / CONTACT"
    draw.text(((W - text_w(draw, adres, f_head)) // 2, y), adres, font=f_head, fill=ALTIN)
    y += 115

    gold_line(draw, y)
    y += 50

    lines = [
        "Mehmet Nesih Özmen Mh.",
        "Fatih Cd. Gülsever Sk.",
        "No: 7/A D: 15",
        "MERTER / İSTANBUL",
    ]
    for line in lines:
        draw.text(((W - text_w(draw, line, f_addr)) // 2, y), line, font=f_addr, fill=KOYU)
        y += 105

    gold_line(draw, y + 10)
    y += 60

    f_num = fnt(F_SEGOE_B, 78)
    num   = "+90 530 850 42 21"
    draw.text(((W - text_w(draw, num, f_num)) // 2, y), num, font=f_num, fill=ALTIN)
    y += 110

    f_url = fnt(F_GARAMOND_B, 82)
    draw.text(((W - text_w(draw, "missnesem.com", f_url)) // 2, y),
              "missnesem.com", font=f_url, fill=KOYU)

    img.save(os.path.join(OUT_DIR, "iletisim-karti.png"), dpi=(150, 150))
    print("✓ iletisim-karti.png")


# ── KART 6: 4 Dil Hizmet Kartı ───────────────────────────────────────────────
def kart6_dil():
    img = dark_bg()
    draw = ImageDraw.Draw(img)

    draw.rectangle([0, 0, W, 8], fill=ALTIN)
    draw.rectangle([0, H - 8, W, H], fill=ALTIN)

    logo = load_logo(bg_is_dark=True, target_w=300)
    paste_logo(img, logo, W // 2, 170)
    draw = ImageDraw.Draw(img)

    gold_line(draw, 320)

    f_flag = fnt(F_SEGOE_B, 95)
    f_lang = fnt(F_GARAMOND_B, 95)
    f_lang_s = fnt(F_SEGOE_B, 85)

    services = [
        ("🇹🇷", "Türkçe Hizmet", f_lang, ALTIN),
        ("🇬🇧", "English Service", f_lang, BEYAZ),
        ("🇸🇦", "خدمة عربية", None, ALTIN),  # None = GDI ile
        ("🇷🇺", "Русский сервис", f_lang_s, BEYAZ),
    ]

    y = 390
    row_h = 245

    for flag, label, font, color in services:
        # Satır kutusu
        box_color = (50, 38, 22) if color == BEYAZ else (40, 30, 14)
        draw.rounded_rectangle([30, y, W - 30, y + row_h - 15], radius=16, fill=box_color)

        # Bayrak
        try:
            f_em = fnt(f"{FONTS}/seguiemj.ttf", 80)
            draw.text((60, y + 70), flag, font=f_em, embedded_color=True)
        except Exception:
            pass

        # Metin
        if font is None:
            # Arapça
            ar = render_arabic_gdi(label, 80, ALTIN, box_color, 580)
            img.paste(ar, (W - ar.width - 60, y + (row_h - 15 - ar.height) // 2), ar)
            draw = ImageDraw.Draw(img)
        else:
            lw = text_w(draw, label, font)
            draw.text((W // 2 - lw // 2 + 30, y + (row_h - 15 - text_h(draw, label, font)) // 2),
                      label, font=font, fill=color)

        y += row_h

    # Alt logo tekrar
    f_url = fnt(F_GARAMOND_B, 72)
    url   = "missnesem.com"
    draw.text(((W - text_w(draw, url, f_url)) // 2, H - 160),
              url, font=f_url, fill=ALTIN)

    img.save(os.path.join(OUT_DIR, "4dil-hizmet-karti.png"), dpi=(150, 150))
    print("✓ 4dil-hizmet-karti.png")


# ── Ana çalıştırıcı ───────────────────────────────────────────────────────────
if __name__ == "__main__":
    print(f"Çıktı klasörü: {OUT_DIR}")
    print(f"Logo: {LOGO_PATH}")
    print("Kartlar üretiliyor...\n")
    kart1_marka()
    kart2_haftasonu()
    kart3_qr()
    kart4_urun_cerceve()
    kart5_iletisim()
    kart6_dil()
    print("\nTüm kartlar tamamlandı!")
