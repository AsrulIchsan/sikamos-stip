import zipfile
import xml.etree.ElementTree as ET

path = r"C:\Users\STIP-7\Documents\DATA CADET\ABSEN 65 68 69 (2026 GANJIL) (1).xlsx"
with zipfile.ZipFile(path, "r") as z:
    sst = []
    if "xl/sharedStrings.xml" in z.namelist():
        root = ET.fromstring(z.read("xl/sharedStrings.xml"))
        for si in root.iter("{http://schemas.openxmlformats.org/spreadsheetml/2006/main}si"):
            text = "".join(t.text for t in si.iter("{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t") if t.text)
            sst.append(text)
    
    wb = ET.fromstring(z.read("xl/workbook.xml"))
    sheets = wb.findall(".//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}sheet")
    for idx, s in enumerate(sheets, 1):
        name = s.attrib["name"]
        sheet_path = f"xl/worksheets/sheet{idx}.xml"
        ws = ET.fromstring(z.read(sheet_path))
        print(f"=== Sheet {name} ===")
        rows = ws.findall(".//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}row")
        for r in rows[:8]:
            row_vals = []
            for c in r.findall("{http://schemas.openxmlformats.org/spreadsheetml/2006/main}c"):
                v = c.find("{http://schemas.openxmlformats.org/spreadsheetml/2006/main}v")
                t = c.attrib.get("t")
                val = ""
                if v is not None and v.text:
                    if t == "s":
                        val = sst[int(v.text)]
                    else:
                        val = v.text
                row_vals.append(f"{c.attrib.get('r')}:{val}")
            print(" | ".join(row_vals))

