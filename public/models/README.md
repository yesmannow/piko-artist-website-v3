# ONNX Model Directory

Place your `demucs_v4_quantized.onnx` file here.

## File Location

```
public/models/demucs_v4_quantized.onnx
```

## Getting the Model

If you don't have the model file yet, you can:

1. **Download from Demucs repository:**
   - Visit: https://github.com/facebookresearch/demucs
   - Look for quantized model downloads
   - Or use their model conversion scripts

2. **Generate from full model:**
   - Use ONNX quantization tools
   - Convert from PyTorch format

3. **Use a pre-quantized version:**
   - Check Hugging Face: https://huggingface.co/models?search=demucs
   - Look for quantized ONNX versions

## File Size

- Quantized model: ~50-200 MB
- Full model: ~500+ MB (not recommended for web)

## Verification

After placing the file, verify it:

```bash
npm run check:stem-assets
```

This should show:

```
✅ Model found: public/models/demucs_v4_quantized.onnx
```

## Git LFS (if file is large)

If the model is >100MB, use Git LFS:

```bash
git lfs install
git lfs track "*.onnx"
git add .gitattributes
git add public/models/demucs_v4_quantized.onnx
git commit -m "Add ONNX model via Git LFS"
```

Then enable LFS support in Vercel project settings.
