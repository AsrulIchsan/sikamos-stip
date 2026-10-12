import zipfile
import re
import xml.etree.ElementTree as ET
import json

def parse_excel_cadets(file_path):
    cadets = []
    seen_nrp = set()

    with zipfile.ZipFile(file_path, "r") as z:
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
            
            # Map cell coordinates
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

            # Find columns that have 'NRP' and 'NAMA'
            for header_row_idx in range(1, 10):
                if header_row_idx not in sheet_data:
                    continue
                row_cells = sheet_data[header_row_idx]
                
                # Check column pairs
                # Look for col with NAMA and nearby col with NRP
                cols = list(row_cells.keys())
                for c in cols:
                    if row_cells[c].upper() == "NAMA":
                        # Look for NRP col in the next 10 columns
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

                            # Extract rows below header_row_idx
                            for r_idx in range(header_row_idx + 1, max(sheet_data.keys()) + 1):
                                if r_idx not in sheet_data:
                                    continue
                                r_data = sheet_data[r_idx]
                                name_val = r_data.get(name_col, "").strip()
                                nrp_val = r_data.get(nrp_col, "").strip()
                                kelas_val = r_data.get(kelas_col, "").strip() if kelas_col else ""

                                if nrp_val and nrp_val.isdigit() and len(nrp_val) >= 6 and name_val:
                                    if nrp_val not in seen_nrp:
                                        seen_nrp.add(nrp_val)
                                        semester = 8 if "4" in sheet_name else (3 if "2" in sheet_name else 1)
                                        cadets.append({
                                            "nrp": nrp_val,
                                            "name": name_val,
                                            "kelas": kelas_val or ("Nautika" if "N" in kelas_val else "Teknika"),
                                            "semester": semester,
                                            "source": f"Excel-{sheet_name}"
                                        })

    return cadets

cadets = parse_excel_cadets(r"C:\Users\STIP-7\Documents\DATA CADET\ABSEN 65 68 69 (2026 GANJIL) (1).xlsx")
print(f"Total cadets extracted from Excel: {len(cadets)}")
if cadets:
    print("Sample 5 cadets:")
    for c in cadets[:5]:
        print(c)

