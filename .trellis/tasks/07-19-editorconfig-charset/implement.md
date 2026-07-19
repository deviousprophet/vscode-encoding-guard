# Implement: .editorconfig charset

## Steps

- [x] Create branch `feat/editorconfig-charset`
- [ ] Install `editorconfig` + `@types/editorconfig`
- [ ] Create `src/editorconfigReader.ts` (mapping + `getEditorConfigCharset`)
- [ ] Modify `applier.ts` (insert call in `resolveTargetEncoding`)
- [ ] Create `src/test/editorconfigReader.test.ts`
- [ ] Run `npm run compile`
- [ ] Run tests
- [ ] Fallow audit
- [ ] Commit

## Validation

```bash
npm run compile
npm test
npx fallow audit --base main --format json
```
