import pymupdf
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

pdf_path = r"C:\Users\liu\Desktop\1_1_★浙江省规培内科评分表（DSY）.pdf"
out_path = r"E:\bingli\tools\评分表全文.txt"

doc = pymupdf.open(pdf_path)
lines = []
for i, page in enumerate(doc):
    text = page.get_text()
    lines.append(f"\n{'='*70}\n--- 第 {i+1} 页 ---\n{'='*70}\n")
    lines.append(text)

doc.close()

with open(out_path, 'w', encoding='utf-8') as f:
    f.write(''.join(lines))

print(f"已导出: {out_path}")
print(f"总字符数: {sum(len(l) for l in lines)}")
