"""Quita el fondo blanco de los iconos de originales/ y los deja listos para PnetLab.
Uso: python3 procesar.py originales/router-rip.jpg router-rip
Genera pnetlab/Pamplona_<nombre>.png (64 x 64, igual que los iconos de PnetLab)
y alta-resolucion/<nombre>.png (128 x 128).
"""
import sys
from PIL import Image, ImageDraw, ImageFilter

TAM_PNETLAB = 64   # tamano de los iconos de color de PnetLab
TAM_ALTA = 128

def procesar(origen, nombre):
    img = Image.open(origen).convert("RGB")
    w, h = img.size
    # 1. Rellenar el fondo blanco desde las 4 esquinas (solo lo conectado al borde,
    #    asi no se borran brillos blancos dentro del equipo)
    marca = (255, 0, 255)
    relleno = img.copy()
    for xy in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]:
        ImageDraw.floodfill(relleno, xy, marca, thresh=60)
    # 2. Mascara de transparencia: fondo = 0, equipo = 255, con borde suavizado
    mascara = Image.new("L", (w, h), 255)
    pm, pr = mascara.load(), relleno.load()
    for y in range(h):
        for x in range(w):
            if pr[x, y] == marca:
                pm[x, y] = 0
    mascara = mascara.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(1.5))
    rgba = img.convert("RGBA")
    rgba.putalpha(mascara)
    # 3. Recortar al equipo y centrarlo en un lienzo cuadrado con 6% de margen
    rgba = rgba.crop(mascara.getbbox())
    lado = int(max(rgba.size) * 1.04)
    lienzo = Image.new("RGBA", (lado, lado), (0, 0, 0, 0))
    lienzo.paste(rgba, ((lado - rgba.width) // 2, (lado - rgba.height) // 2))
    lienzo.resize((TAM_ALTA, TAM_ALTA), Image.LANCZOS).save(f"alta-resolucion/{nombre}.png")
    lienzo.resize((TAM_PNETLAB, TAM_PNETLAB), Image.LANCZOS).save(f"pnetlab/Pamplona_{nombre}.png")
    print(f"OK pnetlab/Pamplona_{nombre}.png")

if __name__ == "__main__":
    procesar(sys.argv[1], sys.argv[2])
