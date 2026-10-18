import pymupdf
import sys
import io

# 强制 UTF-8 输出，避免 Windows 控制台编码问题
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

pdf_path = r"C:\Users\liu\Desktop\1_1_★浙江省规培内科评分表（DSY）.pdf"
doc = pymupdf.open(pdf_path)

print(f"页数: {len(doc)}")
print(f"元数据: {doc.metadata}")
print("=" * 70)

for i, page in enumerate(doc):
    text = page.get_text()
    print(f"\n{'='*70}\n--- 第 {i+1} 页 --- (字符数 {len(text)})\n{'='*70}")
    print(text)
    # 检查是否有表格
    tables = page.find_tables()
    if tables.tables:
        print(f"\n[本页检测到 {len(tables.tables)} 个表格]")

doc.close()
