/**
 * Domain Service: compara versões no formato semver simplificado (`x.y.z`).
 *
 * Lógica pura — sem estado e sem I/O — usada para decidir se existe uma
 * atualização disponível.
 */
export class VersionComparator {
  /** Verdadeiro se `remote` for mais recente que `local`. */
  static isNewer(remote: string, local: string): boolean {
    const r = VersionComparator.parse(remote);
    const l = VersionComparator.parse(local);
    for (let i = 0; i < 3; i += 1) {
      if (r[i] > l[i]) return true;
      if (r[i] < l[i]) return false;
    }
    return false;
  }

  private static parse(version: string): [number, number, number] {
    const [major, minor, patch] = version.trim().split('.').map((part) => parseInt(part, 10));
    return [major || 0, minor || 0, patch || 0];
  }
}
