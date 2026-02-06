import os

def save_to_md(filename, title, content_list):
    """通用保存函数"""
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(f"# {title}\n\n")
        f.writelines(content_list)
    print(f"✅ 已生成: {filename}")

def get_file_content(path, lang="typescript"):
    """读取文件内容并包裹在代码块中"""
    try:
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
            # 根据后缀简单判断语言
            ext = os.path.splitext(path)[1]
            lang_map = {'.vue': 'html', '.ts': 'typescript', '.js': 'javascript', '.json': 'json'}
            current_lang = lang_map.get(ext, lang)
            return f"### File: {path}\n```{current_lang}\n{content}\n```\n\n"
    except Exception as e:
        return f"### File: {path}\n> 读取失败: {e}\n\n"

def run():
    ignore_dirs = {'.git', 'node_modules', '.nuxt', '.output', 'dist', 'public'}
    
    # 1. 介绍文件 (Summary & Structure)
    intro_content = ["## 项目目录结构\n```text\n"]
    for root, dirs, files in os.walk('.'):
        dirs[:] = [d for d in dirs if d not in ignore_dirs]
        level = root.replace('.', '').count(os.sep)
        indent = '  ' * level
        intro_content.append(f"{indent}{os.path.basename(root)}/\n")
        for file in files:
            intro_content.append(f"{'  ' * (level + 1)}{file}\n")
    intro_content.append("```\n")
    save_to_md("3_Project_Introduction.md", "项目概览与结构", intro_content)

    # 2. 根目录配置文件 (Root Configs)
    root_files_content = []
    # 只扫描根目录下的文件
    for item in os.listdir('.'):
        if os.path.isfile(item) and item.endswith(('.ts', '.js', '.json', '.yaml')):
            if item not in {'package-lock.json', 'pnpm-lock.yaml', 'yarn.lock'}:
                root_files_content.append(get_file_content(item))
    save_to_md("2_Root_Configuration.md", "根目录配置文件", root_files_content)

    # 3. APP 业务代码 (App Directory)
    app_content = []
    # 常见的 Nuxt 业务目录
    app_dirs = ['app', 'pages', 'components', 'server', 'composables', 'store', 'middleware', 'layouts']
    for target_dir in app_dirs:
        if os.path.exists(target_dir):
            for root, _, files in os.walk(target_dir):
                for file in files:
                    if file.endswith(('.vue', '.ts', '.js')):
                        file_path = os.path.join(root, file)
                        app_content.append(get_file_content(file_path))
    save_to_md("1_App_Source_Code.md", "App 业务代码汇总", app_content)

if __name__ == "__main__":
    run()
