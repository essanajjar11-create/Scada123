# -*- coding: utf-8 -*-
import os, sys, io, shutil
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

print('--- STARTING MATHEMATICAL ENGINE DOCUMENTATION GENERATION ---')

doc_path = r'C:\Users\ASUS\Desktop\scada f\توثيق_شامل_وموسع_لمشروع_سكادا_والتوأم_الرقمي_SCADA_Digital_Twin.docx'
backup_path = r'C:\Users\ASUS\Desktop\scada f\توثيق_شامل_وموسع_لمشروع_سكادا_والتوأم_الرقمي_SCADA_Digital_Twin_backup.docx'

if not os.path.exists(backup_path):
    shutil.copyfile(doc_path, backup_path)
    print(f'Created backup at: {backup_path}')

doc = docx.Document(doc_path)
print(f'Loaded document: {len(doc.paragraphs)} paragraphs, {len(doc.tables)} tables.')
