import docx2txt
import sys

try:
    text = docx2txt.process(r'd:\Mera Grind\All Projects\Project 36.0 Career Connect AI\Career-Connect-AI---Major-Project1\CareerConnectAI_PRD_HR_v2.0.docx')
    with open('prd_extracted.txt', 'w', encoding='utf-8') as f:
        f.write(text)
    print("DONE")
except Exception as e:
    print("ERR:", e)
