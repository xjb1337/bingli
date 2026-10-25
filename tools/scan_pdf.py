"""扫描教材 PDF 的目录/书签与每页开头，定位需要的章节。

用法：
    python scan_pdf.py <pdf路径> --toc
    python scan_pdf.py <pdf路径> --pages 120 260
    python scan_pdf.py <pdf路径> --find 病历书写 体格检查
"""
import argparse
import sys

try:
    import pymupdf
except ImportError:  # 兼容旧版本
    import fitz as pymupdf


def open_doc(path):
    return pymupdf.open(path)


def cmd_toc(doc):
    toc = doc.get_toc()
    if not toc:
        print('（该 PDF 没有书签目录）')
        return
    print(f'目录条目数：{len(toc)}')
    for level, title, page in toc:
        print(f'{"  " * (level - 1)}{title}  → 第 {page} 页')


def cmd_pages(doc, start, end):
    for pno in range(max(1, start), min(len(doc), end) + 1):
        page = doc[pno - 1]
        text = page.get_text().strip()
        head = ' '.join(text.split())[:180]
        print(f'--- 第 {pno} 页 ({len(text)} 字) ---')
        print(head)


def cmd_find(doc, keywords):
    """逐页找关键词，报告命中页与上下文片段"""
    hits = {}
    for pno in range(len(doc)):
        text = doc[pno].get_text()
        if not text:
            continue
        flat = ''.join(text.split())
        for kw in keywords:
            if kw in flat:
                hits.setdefault(kw, []).append(pno + 1)
    for kw, pages in hits.items():
        # 连续页合并成区间
        ranges = []
        s = pages[0]
        prev = pages[0]
        for p in pages[1:]:
            if p == prev + 1:
                prev = p
                continue
            ranges.append((s, prev))
            s = p
            prev = p
        ranges.append((s, prev))
        desc = '、'.join(f'{a}-{b}' if a != b else str(a) for a, b in ranges)
        print(f'【{kw}】共 {len(pages)} 页：{desc}')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('path')
    ap.add_argument('--toc', action='store_true')
    ap.add_argument('--pages', nargs=2, type=int)
    ap.add_argument('--find', nargs='+')
    args = ap.parse_args()

    doc = open_doc(args.path)
    print(f'总页数：{len(doc)}')
    if args.toc:
        cmd_toc(doc)
    if args.pages:
        cmd_pages(doc, args.pages[0], args.pages[1])
    if args.find:
        cmd_find(doc, args.find)
    doc.close()


if __name__ == '__main__':
    main()
