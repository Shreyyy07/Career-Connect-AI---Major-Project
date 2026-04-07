import zipfile
import xml.etree.ElementTree as ET

doc = zipfile.ZipFile(r'd:\Mera Grind\All Projects\Project 36.0 Career Connect AI\Career-Connect-AI---Major-Project1\CareerConnectAI_PRD_HR_v2.0.docx')
xml_content = doc.read('word/document.xml')
root = ET.fromstring(xml_content)
ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}

paragraphs = []
for p in root.iterfind('.//w:p', ns):
    texts = [node.text for node in p.iterfind('.//w:t', ns) if node.text]
    if texts:
        paragraphs.append(''.join(texts))

print('\n'.join(paragraphs))
