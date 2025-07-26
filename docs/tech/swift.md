# Swift

## データ型

## ページを戻る

### navigationControllerを利用する場合
navigationControllerを設定している場合、それを利用して遷移することができる
```swift
navigationController?.popToRootViewController(animated: true)
```
Udemyより。

### 開いているViewをdissmissする場合
一つ前のViewへ戻ることができる。segue遷移だと遷移する新たな処理が発生してしまうが、dismissすることで負荷をかけない処理にすることができる。
```swift
self.presentingViewController?.presentingViewController?.dismiss(animated: true)
```
サトリクより。

### モーダルから戻る場合
```swift
dismiss(animated: true, completion: nil)
```
`completion`は画面を閉じた際に行う処理を追加できる。何も無い時は`nil`。

## Segueアニメーションの違い

### Show
画面全体を遷移。横にスライド。

Pushes the destination view controller onto the navigation stack, sliding overtop from right to left, providing a back button to return - if not embedded in a navigation controller it will be presented modallyExample: Navigating in Settings, for example tapping General > About

### Show Detail
設定画面などで使用。iPadでは分割画面にできる。iPhoneでは全画面遷移。

For use in a split view controller, replaces the secondary view controller when in a multi-column interface, or if collapsed to one column it will push in the navigation controller
Example: In Messages, tapping a conversation will show the conversation details - replacing the view controller on the right when in a two column layout, or push the conversation when in a single column layout

### Present Modally
モーダル。下から出てくる。

Presents a view controller overtop the current view controller in various fashions as defined by the modal presentation and transition style - most commonly used to present a view controller in a sheet that animates up from the bottom
Example: Selecting Face ID & Passcode in Settings

### Popover Presentation
基本はモーダルだが、iPadでは、outsideをタップすると消える。iPhoneではPresent Modallyと変わらない。

When run on iPad, the destination appears in a popover, and tapping anywhere outside will dismiss it - popovers are supported on iPhone as well but by default it will present the view controller modally
Example: Tapping the + button in Calendar

### Custom
You may implement your own custom segue and have control over its behavior

[What's the difference between all the Selection Segues?](https://stackoverflow.com/questions/25966215/whats-the-difference-between-all-the-selection-segues)

Firebase
!!! question
    Firebaseとは何か。

iOS/AndroidアプリやWebアプリケーションの開発における「バックエンド環境」を提供するサービス。
メリットとして、サーバーサイドに必要な機能がすべて内包されているため、エンジニアはバックエンド側の開発コストを抑えつつ、アプリケーション側の開発に集中できる。

!!! question
    mBaaS（エムバース）とは何か。

もともと、バックエンド環境を**クラウド上で**行えるサービスのことをBaaS （バース）と呼ぶ。
mobile backend as a Serviceの略語で、モバイルアプリ開発のバックエンド側のインフラを提供する。


## ダイアログの表示

ダイアログ/アラートはアクションスタイルと呼ばれる。

デフォルトスタイルだと真ん中に表示し、アクションシートだと下部に表示される。
以下のコードをタップアクションの中に記述する。

### デフォルト
```swift
//アラート生成
//UIAlertControllerのスタイルがalert
let alert: UIAlertController = UIAlertController(title: "表示させたいタイトル", message:  "表示させたいサブタイトル", preferredStyle:  UIAlertController.Style.alert)
// 確定ボタンの処理
let confirmAction: UIAlertAction = UIAlertAction(title: "確定", style: UIAlertAction.Style.default, handler:{
    // 確定ボタンが押された時の処理をクロージャ実装する
    (action: UIAlertAction!) -> Void in
    //実際の処理
    print("確定")
})
// キャンセルボタンの処理
let cancelAction: UIAlertAction = UIAlertAction(title: "キャンセル", style: UIAlertAction.Style.cancel, handler:{
    // キャンセルボタンが押された時の処理をクロージャ実装する
    (action: UIAlertAction!) -> Void in
    //実際の処理
    print("キャンセル")
})

//UIAlertControllerにキャンセルボタンと確定ボタンをActionを追加
alert.addAction(cancelAction)
alert.addAction(confirmAction)

//実際にAlertを表示する
present(alert, animated: true, completion: nil)
```

### アクションシート

```swift
//アラート生成
//UIAlertControllerのスタイルがactionSheet
let actionSheet = UIAlertController(title: "Menu", message: "", preferredStyle: UIAlertController.Style.actionSheet)

// 表示させたいタイトル1ボタンが押された時の処理をクロージャ実装する
let action1 = UIAlertAction(title: "表示させたいタイトル1", style: UIAlertAction.Style.default, handler: {
    (action: UIAlertAction!) in
    //実際の処理
    print("表示させたいタイトル1の処理")
})
// 表示させたいタイトル2ボタンが押された時の処理をクロージャ実装する
let action2 = UIAlertAction(title: "表示させたいタイトル2", style: UIAlertAction.Style.default, handler: {
    (action: UIAlertAction!) in
    //実際の処理
    print("表示させたいタイトル2の処理")

})

// 閉じるボタンが押された時の処理をクロージャ実装する
//UIAlertActionのスタイルがCancelなので赤く表示される
let close = UIAlertAction(title: "閉じる", style: UIAlertAction.Style.destructive, handler: {
    (action: UIAlertAction!) in
    //実際の処理
    print("閉じる")
})

//UIAlertControllerにタイトル1ボタンとタイトル2ボタンと閉じるボタンをActionを追加
actionSheet.addAction(action1)
actionSheet.addAction(action2)
actionSheet.addAction(close)

//実際にAlertを表示する
self.present(actionSheet, animated: true, completion: nil)
```

>参考<br>
>[swift5でダイアログを表示する方法](https://qiita.com/kaneko77/items/010c3836a1a063ad015e)<br>
>[アクションシートを表示する](https://qiita.com/SHOBLOG/items/ea5b28f05494aa13f07b)

## RealmSwiftを使った入力値の保存

呼び出し側

```swift
import RealmSwift

class AddView: UIViewController {

    @IBOutlet weak var itemField: UITextField!
    @IBOutlet weak var datePicker: UIDatePicker!

    @IBAction func onAdd(_ sender: Any) {
        InfoHelper().save(title:itemField.text!,date:datePicker.date)
    }
}
```

関数側

```swift
import RealmSwift

class InfoHelper {
    let realm = try! Realm()
    
    func save(title:String, date:Date){
        let item = TodoItem()
        item.title = title
        item.date = date
        item.id = String(Int.random(in: 0...9999))
        try! realm.write{
            realm.add(item)
        }
    }
}
```

## 画像を選択する

画像をタップするとするとユーザーのアルバムから選択できるようにする。
```swift
@IBOutlet weak var imageView: UIImageView!

override func viewDidLoad() {
    imageView.addGestureRecognizer(UITapGestureRecognizer(target: self, action: #selector(onImage)))
    imageView.isUserInteractionEnabled = true
}

@objc func onImage(){
    let picker = UIImagePickerController()
    picker.sourceType = .photoLibrary
    picker.mediaTypes = ["public.image"]
    picker.delegate = self
    present(picker, animated: true, completion: nil)
}
```

`addGestureRecognizer`

`isUserInteractionEnabled`が`false`の場合、タッチ、押下、フォーカスなどのイベントが無視され、イベントキューから取り除かれる。今回は`true`へ。

`picker.delegate = self`を入力するとエラーになるため、警告文内にある「FIX」を押すと、クラス名のダブルコロン以降に`UIImagePickerControllerDelegate & UINavigationControllerDelegate`が追加される。

選択した後の動きは以下。
```swift
func imagePickerController(_ picker: UIImagePickerController, didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey : Any]) {
    // 魔法の呪文として覚えたら良いかも
    let image = info[UIImagePickerController.InfoKey.originalImage] as! UIImage
    // 選択した画像を表示する画像へ格納
    imageView.image = image
    // Picker画面の終了
    dismiss(animated: true, completion: nil)
}
```

## 余白をタップした時にキーボードを隠す

```swift
view.addGestureRecognizer(UITapGestureRecognizer(target: self, action: #selector(hideKeyboard)))
```
`view`は画面全体を示している。

```swift
@objc func hideKeyboard(){
    view.endEditing(true)
}
```

## Firebaseを使ったログイン

以下のクラスでは４つのメソッドがある。

```swift
import Foundation
import Firebase

class AuthHelper {
    
    func createAccount(email:String, password:String, result: @escaping(Bool) -> Void){
        Auth.auth().createUser(withEmail: email, password: password, completion: {
            authResult,error in
            if error == nil {
                 result(true)
            } else {
                print("Error:\(error!)")
                result(false)
            }
        })
    }
    
    func login(email:String, password:String, result: @escaping(Bool) -> Void){
        Auth.auth().signIn(withEmail: email, password: password, completion: {
            authResult,error in
            if error == nil {
                 result(true)
            } else {
                print("Error:\(error!)")
                result(false)
            }
        })
    }
    
    func uid() -> String {
        guard let user = Auth.auth().currentUser else { return "" }
        return user.uid
    }
    
    func signOut() {
        do {
            try Auth.auth().signOut()
        } catch {
            print{"Error siging out"}
        }
    }
}
```

```swift
import Firebase
```
Firebaseの使用にあたり、必ずimportすべし。

`-> Void`は戻り値が無い関数に使われるそうだが、もっと調べて理解を深める必要がある。


## CocoaPodsの導入方法

### 未インストールなら

```bash
$ sudo gem install -n /usr/local/bin cocoapods
$ pod setup
```

### セットアップ

```bash
$ cd ~/testProject
$ pod init
```

生成されたPodfileにインストールしたいライブラリを以下のように記述。

```swift
# Uncomment the next line to define a global platform for your project
# platform :ios, '9.0'

target 'TodoTest' do
# Comment the next line if you don't want to use dynamic frameworks
use_frameworks!

# Pods for TodoTest
pod 'RealmSwift'
end
```

```bash
$ pod install
```


### 新しいライブラリをインストールする時

```bash
$ pod update
```

```swift

```

## 実機へのインストール

- [ ] idが正しくないと（自分のmacのものでないと？）エラーになる
- [ ] iOSのバージョンに対応したものをインストールする必要がある　※デバイスは関係なく、あくまでiOSバージョン

>恐らくidentifierが許可されていない（最初に実機にインストールする時）時、「信頼されていないデベロッパ」が表示されるので **「設定」-「一般」-「デバイス管理」** から許可する。
>参考[【iPhone】「信頼されていないデベロッパ」ダイアログが出た時の対処法](https://qiita.com/nonkapibara/items/d14c796ca69c8a4e58d2)

### 最新のiOSに古いXcode経由でアプリをインストールする

本来、Xcodeのバージョンと対応するiOSのバージョンは決められており、このバージョンが一致していないと正しく実機でRunできない。[公式ページ](https://developer.apple.com/jp/support/xcode/)
ただ、なんとか対応させる方法があるので以下に記載する。
[iGhibli](https://github.com/iGhibli/iOS-DeviceSupport/tree/master/DeviceSupport)というリポジトリから必要なデバイスのzipをダウンロードし、フォルダを`/Applications/Xcode.app/Contents/Developer/Platforms/iPhoneOS.platform/DeviceSupport/`の中に格納

!!! danger
    ただし、このやり方は[Developer Fourm](https://developer.apple.com/forums/thread/673131?answerId=661007022#661007022)で紹介されている非公式な方法であり、個人のリポジトリにiOSのDeviceSupportファイルをアップして問題ないのかどうかは不明なので自己責任で。

>参考
>
>[[Xcode]最新のiOSに古いXcode経由でアプリをインストールする](https://zenn.dev/sukedon/articles/0ec92289f4141a)
>[古いXcodeでも新しいiOS実機で確認する方法(2)](https://www.subthread.co.jp/blog/20200605/)
