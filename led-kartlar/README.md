# Miss Neşem LED Ekran Kartları

880×1560 px dikey görsel kartlar — ViPlex Express yönetimli dış cephe LED ekranı için.

## Dosyalar

| Dosya | İçerik | Süre |
|---|---|---|
| `marka-karti.png` | Logo + 4 dil slogan + web adresi | 8 sn |
| `haftasonu-karti.png` | Kapalı duyurusu + WhatsApp bilgisi | 10 sn |
| `qr-whatsapp.png` | QR kod ile doğrudan WhatsApp bağlantısı | 12 sn |
| `urun-cerceve.png` | Ürün fotoğrafı şablonu | 6 sn |
| `iletisim-karti.png` | Adres + telefon + web | 8 sn |
| `4dil-hizmet-karti.png` | TR/EN/AR/RU dil göstergesi | 8 sn |

## ViPlex Express'e Yükleme

1. ViPlex Express → **Programlar** → **Yeni Program**
2. Çözünürlük: **880 × 1560** piksel
3. Her kart için **Resim Ekle** → PNG dosyasını seç → Süreyi ayarla
4. Önerilen sıra (normal gün):
   ```
   marka-karti → 4dil-hizmet-karti → urun-cerceve → iletisim-karti → qr-whatsapp
   ```
5. Hafta sonu / tatil günü sırası:
   ```
   haftasonu-karti → qr-whatsapp → marka-karti
   ```
6. Programı kaydet → **Yayınla**

## Kartları Yeniden Üretmek

```bash
cd led-kartlar
python generate_cards.py
```

Gereksinimler: `pillow`, `qrcode` → `pip install pillow qrcode[pil]`

## Ürün Çerçevesini Özelleştirmek

`generate_cards.py` içindeki `kart4_urun_cerceve()` fonksiyonuna ürün fotoğrafı yolu ekleyin:

```python
urun_foto = Image.open("urun.jpg").convert("RGBA")
# ... resize ve paste işlemleri
```

## Önizleme

`generate.html` dosyasını tarayıcıda açın — tüm kartları önizler ve tek tek indirmenizi sağlar.

---

**Ekran:** 4 katlı bina dış cephesi · ViPlex Express · 880×1560 px  
**QR Linki:** wa.me/905308504221 — Miss Neşem koleksiyon talebi  
**Adres:** Mehmet Nesih Özmen Mh. Fatih Cd. Gülsever Sk. No:7/A D:15 Merter/İstanbul
