"""按页码抽取 PDF 指定区间的文字到文件。

用法：
    python extract_range.py <pdf> <起始页> <结束页> <输出文件>
页码为 PDF 物理页码（与书签页号一致）。
"""
import sys

try:
    import pymupdf
except ImportError:
    import fitz as pymupdf


def main():
    pdf, start, end, out = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), sys.argv[4]
    doc = pymupdf.open(pdf)
    chunks = []
    for pno in range(max(1, start), min(len(doc), end) + 1):
        text = doc[pno - 1].get_text()
        chunks.append(f'\n========== 第 {pno} 页 ==========\n{text}')
    doc.close()
    body = ''.join(chunks)
    with open(out, 'w', encoding='utf-8') as f:
        f.write(body)
    print(f'已写入 {out}：{end - start + 1} 页，{len(body)} 字符')


if __name__ == '__main__':
    main()
