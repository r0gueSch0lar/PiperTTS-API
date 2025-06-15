# This is an example PKGBUILD file. Use this as a start to creating your own,
# and remove these comments. For more information, see 'man PKGBUILD'.
# NOTE: Please fill out the license field for your package! If it is unknown,
# then please put 'unknown'.

# Maintainer: Your Name <youremail@domain.com>
_pkgname=pipertts-api
pkgname=nodejs-$_pkgname
pkgver=1.0.0
pkgrel=1
pkgdesc="NodeJS based API Wrapper for piper-tts"
arch=(x86_64)
url="https://github.com/r0gueSch0lar/PiperTTS-API.git"
license=('GPL')
depends=("nodejs piper-tts piper-voices-minimal")
makedepends=("npm")
checkdepends=()
optdepends=("piper-voices-common ")
provides=()
conflicts=()
replaces=("pipertts-api")
backup=()
options=()
install=
changelog=
source=("package.json"
        "package-lock.json"
		"server.js"
        "pipertts-api.service")
noextract=()
sha256sums=()
validpgpkeys=()


package() {
    npm install -g --prefix "${pkgdir}/usr" --cache "${srcdir}/npm-cache"
    install -Dm644 $_pkgname.service ${pkgdir}/usr/lib/systemd/system/$_pkgname.service
    # Remove references to $pkgdir
    find "$pkgdir" -type f -name package.json -print0 | xargs -0 sed -i "/_where/d"
    # Remove references to $srcdir
	local tmppackage="$(mktemp)"
	local pkgjson="$pkgdir/usr/lib/node_modules/$_pkgname/package.json"
    jq '.|=with_entries(select(.key|test("_.+")|not))' "$pkgjson" > "$tmppackage"
    mv "$tmppackage" "$pkgjson"
    chmod 644 "$pkgjson"
    find "$pkgdir" -type f -name package.json | while read pkgjson; do
		local tmppackage="$(mktemp)"
		jq 'del(.man)' "$pkgjson" > "$tmppackage"
		mv "$tmppackage" "$pkgjson"
		chmod 644 "$pkgjson"
	done

}