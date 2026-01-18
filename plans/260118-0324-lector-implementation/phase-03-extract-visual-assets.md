# Phase 3: Extract Visual Assets

## Context
- [cclk.pdf](../../cclk.pdf) - Source PDF with huyệt diagrams
- [ai-multimodal skill](~/.claude/skills/ai-multimodal/) - Image extraction

## Overview
- **Priority:** P2
- **Status:** Pending
- **Effort:** 2h

Extract acupuncture point position diagrams from cclk.pdf for visual card questions.

## Key Insights

- cclk.pdf contains diagrams showing huyệt positions on body
- Visual learning improves retention
- Images can be used for "identify this huyệt" questions

## Requirements

### Functional
- Extract relevant pages/diagrams from cclk.pdf
- Crop individual huyệt position images
- Name images consistently: `{huyet-id}.png`

### Non-functional
- Images optimized for web (max 200KB each)
- Consistent dimensions for UI
- PNG format with transparency

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  IMAGE EXTRACTION PIPELINE                   │
├─────────────────────────────────────────────────────────────┤
│  1. Identify relevant pages in cclk.pdf                     │
│  2. Extract full-page images using ai-multimodal            │
│  3. Use Gemini to identify huyệt regions                    │
│  4. Crop individual huyệt images                            │
│  5. Optimize and save to assets/images/                     │
└─────────────────────────────────────────────────────────────┘
```

## Output Structure

```
cclk-cards/
└── assets/
    └── images/
        ├── thieu-phu.png
        ├── than-mon.png
        ├── linh-dao.png
        └── ...
```

## Related Code Files

### To Create
- `scripts/extract-pdf-images.ts` - Extraction script
- `cclk-cards/assets/images/*.png` - Output images

### Tools Required
- `ai-multimodal` skill for PDF analysis
- `imagemagick` for cropping/optimization

## Implementation Steps

### Step 1: PDF Page Analysis
```bash
# Use ai-multimodal to analyze PDF structure
python ~/.claude/skills/ai-multimodal/scripts/gemini_batch_process.py \
  --files cclk.pdf \
  --task analyze \
  --prompt "List all pages containing acupuncture point diagrams with page numbers"
```

### Step 2: Extract Relevant Pages
```bash
# Extract specific pages as images
pdftoppm -png -f {start} -l {end} cclk.pdf page
```

### Step 3: Identify Huyệt Regions
```bash
# Use Gemini vision to locate huyệt positions
python ~/.claude/skills/ai-multimodal/scripts/gemini_batch_process.py \
  --files page-*.png \
  --task analyze \
  --prompt "Identify all labeled acupuncture points. Return JSON with name and bounding box."
```

### Step 4: Crop and Optimize
```bash
# Use ImageMagick to crop
convert page-1.png -crop {width}x{height}+{x}+{y} thieu-phu.png

# Optimize
convert thieu-phu.png -resize 400x400 -quality 85 thieu-phu.png
```

### Step 5: Update Card References
```yaml
# In enhanced card frontmatter
image: assets/images/thieu-phu.png
```

## Todo List

- [ ] Analyze cclk.pdf structure
- [ ] Identify pages with huyệt diagrams
- [ ] Extract page images
- [ ] Locate individual huyệt regions
- [ ] Crop and optimize images
- [ ] Update card frontmatter with image paths
- [ ] Verify all images display correctly

## Success Criteria

- At least 50% of huyệt have associated images
- Images clear and identifiable
- Total image size under 5MB
- Visual cards parse and display

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| PDF has poor image quality | Medium | Manual enhancement |
| Huyệt not labeled in PDF | High | Skip visual cards for those |
| Large file size | Low | Aggressive optimization |

## Security Considerations

- PDF is local, no external access needed
- Images stored in vault, not uploaded

## Next Steps

After completion:
- Update card parser for IMG:: format
- Move to Phase 4: LECTOR Engine
