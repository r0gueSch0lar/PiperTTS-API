# This is an example PKGBUILD file. Use this as a start to creating your own,
# and remove these comments. For more information, see 'man PKGBUILD'.
# NOTE: Please fill out the license field for your package! If it is unknown,
# then please put 'unknown'.

# Maintainer: Your Name <youremail@domain.com>
pkgname=pipertts-api
pkgver=1.0.0
pkgrel=1
pkgdesc="NodeJS based API Wrapper for piper-tts"
arch=(x86_64)
url="https://github.com/r0gueSch0lar/PiperTTS-API.git"
license=('GPL')
depends=("piper-tts piper-voices-minimal")
makedepends=("nodejs npm")
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
		"server.js")
noextract=()
sha256sums=()
validpgpkeys=()

# prepare() {
# 	cd "$pkgname-$pkgver"
# 	patch -p1 -i "$srcdir/$pkgname-$pkgver.patch"
# }

build() {
	npm install -g --prefix "${pkgdir}/usr" --cache "${srcdir}/npm-cache"
}

check() {
	cd "$pkgname-$pkgver"
	make -k check
}

package() {
	cd "$pkgname-$pkgver"
	make DESTDIR="$pkgdir/" install
}