import re

def parse_html_cadets(html_path):
    cadets = []
    with open(html_path, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()

    rows = re.findall(r'<tr[^>]*>[\s\S]*?</tr>', content)
    for r in rows:
        tds = re.findall(r'<td[^>]*>([\s\S]*?)</td>', r)
        if len(tds) >= 13:
            # Check if td[5] or td[2] or td[4] looks like NRP / NIM
            # In our earlier check:
            # td[0]: No.
            # td[1]: img with photo
            # td[2]: Kode pendaftar
            # td[3]: Nama
            # td[4]: No Ujian
            # td[5]: NIM
            # td[11]: Prodi Pilihan
            # td[12]: Prodi Diterima
            img_match = re.search(r'src="([^"]+)"', tds[1])
            photo_src = img_match.group(1) if img_match else ""
            name = re.sub(r'<[^>]+>', '', tds[3]).strip()
            nim = re.sub(r'<[^>]+>', '', tds[5]).strip()
            prodi = re.sub(r'<[^>]+>', '', tds[12]).strip()

            if nim and nim.isdigit() and len(nim) >= 6 and name:
                cadets.append({
                    "nrp": nim,
                    "name": name,
                    "kelas": prodi,
                    "photo": photo_src
                })
    return cadets

c68 = parse_html_cadets(r"C:\Users\STIP-7\Documents\DATA CADET\68\SIAKAD\Laporan Biodata Pendaftar - Periode 2025 Ganjil.html")
c69 = parse_html_cadets(r"C:\Users\STIP-7\Documents\DATA CADET\69\SIAKAD\Laporan Biodata Pendaftar - Periode 2026 Ganjil.html")
print(f"HTML 68 cadets: {len(c68)}")
print(f"HTML 69 cadets: {len(c69)}")
if c69:
    print("Sample HTML 69:", c69[0])

