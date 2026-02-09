import os

def consolidate_src_to_markdown(src_path, output_dir):
    if not os.path.exists(src_path):
        print(f"错误: 找不到目录 {src_path}")
        return

    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    # 1. 处理 src 根目录下的文件 (整合到一个 md)
    root_files_content = []
    items = os.listdir(src_path)
    
    for item in items:
        item_path = os.path.join(src_path, item)
        if os.path.isfile(item_path):
            content = read_file_content(item_path)
            root_files_content.append(f"## File: {item}\n\n{content}\n")
    
    if root_files_content:
        with open(os.path.join(output_dir, "src_root_files.md"), "w", encoding="utf-8") as f:
            f.write("# SRC Root Files\n\n")
            f.write("\n---\n".join(root_files_content))
        print("✅ 已生成: src_root_files.md")

    # 2. 处理 src 下的每个子目录 (每个目录一个 md)
    for item in items:
        item_path = os.path.join(src_path, item)
        if os.path.isdir(item_path):
            dir_content = []
            # 递归遍历子目录下的所有文件
            for root, _, files in os.walk(item_path):
                for file in files:
                    file_path = os.path.join(root, file)
                    relative_path = os.path.relpath(file_path, src_path)
                    content = read_file_content(file_path)
                    dir_content.append(f"## File: {relative_path}\n\n{content}\n")
            
            if dir_content:
                filename = f"module_{item}.md"
                with open(os.path.join(output_dir, filename), "w", encoding="utf-8") as f:
                    f.write(f"# Content of {item}\n\n")
                    f.write("\n---\n".join(dir_content))
                print(f"✅ 已生成: {filename}")

def read_file_content(file_path):
    """读取文件内容并包裹在 Markdown 代码块中"""
    ext = os.path.splitext(file_path)[1].lstrip('.')
    # 映射常见 NestJS/TS 后缀
    lang = "typescript" if ext in ['ts', 'tsx'] else ext
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            code = f.read()
            return f"```{lang}\n{code}\n```"
    except Exception as e:
        return f"*无法读取文件 {file_path}: {e}*"

if __name__ == "__main__":
    # 配置路径
    SRC_DIRECTORY = "./src"  # 你的 NestJS src 路径
    OUTPUT_DIRECTORY = "./dist_md" # 生成的 md 存放路径
    
    consolidate_src_to_markdown(SRC_DIRECTORY, OUTPUT_DIRECTORY)