import sqlite3
import zipfile
import re
import os
import xml.etree.ElementTree as ET
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "prisma", "dev.db")
EXCEL_PATH = r"C:\Users\STIP-7\Documents\DATA CADET\ABSEN 65 68 69 (2026 GANJIL) (1).xlsx"
HTML_68 = r"C:\Users\STIP-7\Documents\DATA CADET\68\SIAKAD\Laporan Biodata Pendaftar - Periode 2025 Ganjil.html"
HTML_69 = r"C:\Users\STIP-7\Documents\DATA CADET\69\SIAKAD\Laporan Biodata Pendaftar - Periode 2026 Ganjil.html"

def get_cadets_from_excel():
    cadets = {}
    if not os.path.exists(EXCEL_PATH):
        print("Excel file not found:", EXCEL_PATH)
        return cadets

    with zipfile.ZipFile(EXCEL_PATH, "r") as z:
        sst = []
        if "xl/sharedStrings.xml" in z.namelist():
            root = ET.fromstring(z.read("xl/sharedStrings.xml"))
            for si in root.iter("{http://schemas.openxmlformats.org/spreadsheetml/2006/main}si"):
                text = "".join(t.text for t in si.iter("{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t") if t.text)
                sst.append(text)

        wb = ET.fromstring(z.read("xl/workbook.xml"))
        sheets = wb.findall(".//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}sheet")
        for idx, s in enumerate(sheets, 1):
            sheet_name = s.attrib["name"]
            sheet_path = f"xl/worksheets/sheet{idx}.xml"
            ws = ET.fromstring(z.read(sheet_path))
            rows = ws.findall(".//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}row")
            
            sheet_data = {}
            for r in rows:
                row_idx = int(r.attrib["r"])
                sheet_data[row_idx] = {}
                for c in r.findall("{http://schemas.openxmlformats.org/spreadsheetml/2006/main}c"):
                    col_ref = c.attrib["r"]
                    col_letters = "".join(filter(str.isalpha, col_ref))
                    v = c.find("{http://schemas.openxmlformats.org/spreadsheetml/2006/main}v")
                    t = c.attrib.get("t")
                    val = ""
                    if v is not None and v.text:
                        if t == "s":
                            val = sst[int(v.text)]
                        else:
                            val = v.text
                    sheet_data[row_idx][col_letters] = val.strip()

            for header_row_idx in range(1, 10):
                if header_row_idx not in sheet_data:
                    continue
                row_cells = sheet_data[header_row_idx]
                cols = list(row_cells.keys())
                for c in cols:
                    if row_cells[c].upper() == "NAMA":
                        name_col = c
                        nrp_col = None
                        kelas_col = None
                        for candidate in cols:
                            val = row_cells[candidate].upper()
                            if val == "NRP" and candidate > name_col:
                                nrp_col = candidate
                                break
                        if nrp_col:
                            for candidate in cols:
                                val = row_cells[candidate].upper()
                                if val in ["KELAS", "KLS"] and candidate > nrp_col:
                                    kelas_col = candidate
                                    break

                            for r_idx in range(header_row_idx + 1, max(sheet_data.keys()) + 1):
                                if r_idx not in sheet_data:
                                    continue
                                r_data = sheet_data[r_idx]
                                name_val = r_data.get(name_col, "").strip()
                                nrp_val = r_data.get(nrp_col, "").strip()
                                kelas_val = r_data.get(kelas_col, "").strip() if kelas_col else ""

                                if nrp_val and nrp_val.isdigit() and len(nrp_val) >= 6 and name_val:
                                    semester = 8 if "4" in sheet_name else (3 if "2" in sheet_name else 1)
                                    # Standarisasi nama kelas
                                    clean_kelas = kelas_val
                                    if clean_kelas.startswith("N"):
                                        clean_kelas = f"NAUTIKA {clean_kelas[1:].strip()}"
                                    elif clean_kelas.startswith("T"):
                                        clean_kelas = f"TEKNIKA {clean_kelas[1:].strip()}"
                                    elif clean_kelas.startswith("K"):
                                        clean_kelas = f"KALK {clean_kelas[1:].strip()}"

                                    cadets[nrp_val] = {
                                        "nrp": nrp_val,
                                        "name": name_val,
                                        "kelas": clean_kelas or "NAUTIKA",
                                        "semester": semester,
                                        "photo": None
                                    }
    return cadets

def enrich_from_html(cadets, html_path):
    if not os.path.exists(html_path):
        return
    with open(html_path, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()

    rows = re.findall(r'<tr[^>]*>[\s\S]*?</tr>', content)
    for r in rows:
        tds = re.findall(r'<td[^>]*>([\s\S]*?)</td>', r)
        if len(tds) >= 13:
            img_match = re.search(r'src="([^"]+)"', tds[1])
            photo_src = img_match.group(1) if img_match else ""
            name = re.sub(r'<[^>]+>', '', tds[3]).strip()
            nim = re.sub(r'<[^>]+>', '', tds[5]).strip()
            prodi = re.sub(r'<[^>]+>', '', tds[12]).strip()

            if nim and nim.isdigit() and len(nim) >= 6:
                if nim in cadets:
                    if photo_src and not cadets[nim]["photo"]:
                        cadets[nim]["photo"] = photo_src
                else:
                    cadets[nim] = {
                        "nrp": nim,
                        "name": name,
                        "kelas": prodi or "NAUTIKA",
                        "semester": 1,
                        "photo": photo_src
                    }

def main():
    print("Membaca data kadet dari Excel dan SIAKAD HTML...")
    cadets = get_cadets_from_excel()
    print(f"Total kadet dari Excel: {len(cadets)}")

    enrich_from_html(cadets, HTML_68)
    enrich_from_html(cadets, HTML_69)
    print(f"Total total kadet terintegrasi: {len(cadets)}")

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    now_iso = datetime.utcnow().isoformat() + "Z"

    # 1. Buat Akun Admin Utama
    cursor.execute("""
    INSERT OR REPLACE INTO User (id, name, email, password, role, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, ("admin_utama", "Admin Utama BPSDM / STIP Indonesia", "admin@stip.ac.id", "admin123", "ADMIN", now_iso, now_iso))

    # Akun Dosen STIP
    cursor.execute("""
    INSERT OR REPLACE INTO User (id, name, email, password, role, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, ("dosen_stip_01", "Capt. Sugeng Hartono, M.Mar., M.Pd.", "dosen@stip.ac.id", "dosen123", "DOSEN_STIP", now_iso, now_iso))

    # Akun Mitra Luar Negeri
    cursor.execute("""
    INSERT OR REPLACE INTO User (id, name, email, password, role, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, ("mitra_wmu_01", "Prof. Henrik Nilsson, Ph.D. (WMU Sweden)", "mitra@wmu.se", "mitra123", "MITRA", now_iso, now_iso))

    # 2. Master Data Negara & Universitas
    countries = [
        ("c_se", "SE", "Swedia (Sweden)"),
        ("c_jp", "JP", "Jepang (Japan)"),
        ("c_nl", "NL", "Belanda (Netherlands)"),
        ("c_sg", "SG", "Singapura (Singapore)"),
        ("c_de", "DE", "Jerman (Germany)"),
    ]
    for cid, code, name in countries:
        cursor.execute("""
        INSERT OR REPLACE INTO Country (id, code, name, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?)
        """, (cid, code, name, now_iso, now_iso))

    unis = [
        ("u_wmu", "World Maritime University (WMU)", "c_se", "Fiskehamnsgatan 1, 211 18 Malmö", "https://www.wmu.se"),
        ("u_tumst", "Tokyo University of Marine Science and Technology", "c_jp", "4 Chome-5-7 Konan, Minato City, Tokyo", "https://www.kaiyodai.ac.jp"),
        ("u_rmi", "Rotterdam Mainport Institute / STC Group", "c_nl", "Lloydstraat 300, 3024 EA Rotterdam", "https://www.stc-group.nl"),
        ("u_sma", "Singapore Maritime Academy", "c_sg", "500 Dover Rd, Singapore", "https://www.sp.edu.sg/sma"),
    ]
    for uid, uname, ucid, uaddr, uweb in unis:
        cursor.execute("""
        INSERT OR REPLACE INTO University (id, name, countryId, address, website, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (uid, uname, ucid, uaddr, uweb, now_iso, now_iso))

    # 3. Masukkan seluruh Kadet: ID & Password = NRP
    inserted_cadets = 0
    for nrp, c in cadets.items():
        user_id = f"kadet_{nrp}"
        email = f"{nrp}@stip.ac.id"
        password = nrp # ID dan PASS adalah NRP!

        # Insert User
        cursor.execute("""
        INSERT OR REPLACE INTO User (id, name, email, password, role, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (user_id, c["name"], email, password, "KADET", now_iso, now_iso))

        # Pilih kampus tujuan untuk sebagian kadet mobilitas
        uni_id = "u_wmu" if (int(nrp) % 4 == 0) else ("u_tumst" if (int(nrp) % 4 == 1) else ("u_rmi" if (int(nrp) % 4 == 2) else "u_sma"))

        cursor.execute("""
        INSERT OR REPLACE INTO KadetProfile (id, userId, nrp, kelas, semester, pasporNo, fotoProfil, universityId, programName, startDate, endDate, dosenStipId, mitraId, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            f"kp_{nrp}",
            user_id,
            nrp,
            c["kelas"],
            c["semester"],
            f"B{nrp[:7]}",
            c.get("photo"),
            uni_id,
            "International Cadet Mobility Program 2026",
            "2026-02-01T00:00:00Z",
            "2026-07-31T00:00:00Z",
            "dosen_stip_01",
            "mitra_wmu_01",
            now_iso,
            now_iso
        ))
        inserted_cadets += 1

    # 4. Tambahkan contoh data login history awal
    sample_logins = [
        ("admin_utama", "Admin Utama BPSDM / STIP Indonesia", "admin@stip.ac.id", "ADMIN", "127.0.0.1", "SUCCESS"),
        ("dosen_stip_01", "Capt. Sugeng Hartono, M.Mar., M.Pd.", "dosen@stip.ac.id", "DOSEN_STIP", "127.0.0.1", "SUCCESS"),
        ("mitra_wmu_01", "Prof. Henrik Nilsson, Ph.D.", "mitra@wmu.se", "MITRA", "192.168.1.45", "SUCCESS"),
    ]
    for uid, uname, ident, urole, uip, ustat in sample_logins:
        cursor.execute("""
        INSERT INTO LoginHistory (id, userId, userName, identifier, role, ipAddress, userAgent, status, loginAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (f"lh_{uid}_{datetime.utcnow().timestamp()}", uid, uname, ident, urole, uip, "Chrome / Windows 11", ustat, now_iso))

    conn.commit()
    conn.close()
    print(f"Berhasil mengimpor {inserted_cadets} akun Kadet ke database!")
    print("Akun Admin Utama: admin@stip.ac.id / pass: admin123")
    print("Setiap Kadet dapat login menggunakan NRP sebagai username dan NRP sebagai password.")

if __name__ == "__main__":
    main()

