#!/usr/bin/env python3
import os
import re
import json

SITE_DIR = "/root/bazaars/Mega-AI-Bazaar"

def audit_page(filepath):
    errors = []
    warnings = []
    
    with open(filepath, "r", encoding="utf-8") as f:
        html = f.read()
        
    # 1. Unique <title>
    title_match = re.search(r"<title>(.*?)</title>", html, re.IGNORECASE | re.DOTALL)
    if not title_match:
        errors.append("Missing <title> tag")
    else:
        title = title_match.group(1).strip()
        if len(title) < 10 or len(title) > 70:
            warnings.append(f"Title length ({len(title)}) is outside recommended 10-70 chars: '{title}'")
            
    # 2. Meta description (120-160 chars)
    desc_match = re.search(r'<meta\s+name=["\']description["\']\s+content=["\'](.*?)["\']', html, re.IGNORECASE)
    if not desc_match:
        errors.append("Missing meta description")
    else:
        desc = desc_match.group(1).strip()
        if len(desc) < 100 or len(desc) > 170:
            warnings.append(f"Meta description length ({len(desc)}) is outside recommended 100-170 chars: '{desc}'")
            
    # 3. Meta keywords
    kw_match = re.search(r'<meta\s+name=["\']keywords["\']\s+content=["\'](.*?)["\']', html, re.IGNORECASE)
    if not kw_match:
        warnings.append("Missing meta keywords tag")
        
    # 4. Canonical link
    canonical_match = re.search(r'<link\s+rel=["\']canonical["\']\s+href=["\'](.*?)["\']', html, re.IGNORECASE)
    if not canonical_match:
        errors.append("Missing canonical link")
        
    # 5. OpenGraph Tags
    og_title = re.search(r'<meta\s+property=["\']og:title["\']', html, re.IGNORECASE)
    og_desc = re.search(r'<meta\s+property=["\']og:description["\']', html, re.IGNORECASE)
    og_type = re.search(r'<meta\s+property=["\']og:type["\']', html, re.IGNORECASE)
    og_url = re.search(r'<meta\s+property=["\']og:url["\']', html, re.IGNORECASE)
    if not (og_title and og_desc and og_type and og_url):
        warnings.append("Incomplete Open Graph tags (og:title, og:description, og:type, og:url)")
        
    # 6. Twitter tags
    twitter_card = re.search(r'<meta\s+name=["\']twitter:card["\']', html, re.IGNORECASE)
    if not twitter_card:
        warnings.append("Missing twitter:card tag")
        
    # 7. Heading check (Exactly one h1)
    h1_matches = re.findall(r"<h1.*?>(.*?)</h1>", html, re.IGNORECASE | re.DOTALL)
    if len(h1_matches) == 0:
        errors.append("Missing <h1> tag")
    elif len(h1_matches) > 1:
        errors.append(f"Multiple <h1> tags found: {len(h1_matches)}")
        
    # 8. Link text quality (Avoid 'click here' etc.)
    poor_link_texts = ["click here", "read more", "browse all", "open", "here", "form"]
    for match in re.finditer(r"<a\s+.*?>(.*?)</a>", html, re.IGNORECASE | re.DOTALL):
        link_text = re.sub(r"<.*?>", "", match.group(1)).strip().lower()
        if link_text in poor_link_texts:
            warnings.append(f"Non-descriptive link text found: '{link_text}'")
            
    # 9. Valid JSON-LD
    json_ld_matches = re.findall(r'<script\s+type=["\']application/ld\+json["\'].*?>(.*?)</script>', html, re.DOTALL | re.IGNORECASE)
    for index, script_content in enumerate(json_ld_matches):
        try:
            json.loads(script_content.strip())
        except json.JSONDecodeError as e:
            errors.append(f"Invalid JSON-LD block #{index+1}: {e}")
            
    return errors, warnings

def main():
    pages = [os.path.join(SITE_DIR, "index.html")]
    b_dir = os.path.join(SITE_DIR, "b")
    if os.path.exists(b_dir):
        for f in os.listdir(b_dir):
            if f.endswith(".html"):
                pages.append(os.path.join(b_dir, f))
                
    print(f"Auditing {len(pages)} pages...")
    total_errors = 0
    total_warnings = 0
    
    for page in pages:
        rel_path = os.path.relpath(page, SITE_DIR)
        errors, warnings = audit_page(page)
        total_errors += len(errors)
        total_warnings += len(warnings)
        
        if errors or warnings:
            print(f"\n--- {rel_path} ---")
            for err in errors:
                print(f"❌ ERROR: {err}")
            for warn in warnings:
                print(f"⚠️ WARN: {warn}")
                
    print(f"\nSEO Audit Complete. Total Errors: {total_errors}, Total Warnings: {total_warnings}")

if __name__ == "__main__":
    main()
