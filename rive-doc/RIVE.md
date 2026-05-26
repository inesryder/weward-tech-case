# Rive assets & specs

## **Rive overview**

> Rive file uses a **master ViewModel** `MainVM` and **nested ViewModels** `iconVM` with properties in both.

## Rive file - asset

[like_favorite.riv](https://uploads.linear.app/dea90e65-6f35-42e2-a694-acb933ee9760/c35de563-09d4-4c7f-9f99-716bc513dd9a/3488e11e-fa23-4823-9718-59c48a305d78)

##

Rive previews

> 👉 Preview is available below with all inputs accessible to test :
>
> [Like_Favorite](https://rive.app/s/Od4nP5V5ukOB78IfOgQMMA/?runtime=rive-renderer)

---

## Rive file specs :

### File Refs

> - File name : `like_favorite.riv`
> - Artboard name : `like_favorite`
> - Native resolution : 32x832 px
> - State Machine name : `sm`
> - Artboard VM name (master VM) : `MainVM`

### View Models

- **Master view model** `MainVM`

| ## properties | ## description                                                                                            |
| ------------- | --------------------------------------------------------------------------------------------------------- |
| `isActive`    | boolean for state of the button* TRUE when tapped<br>* FALSE when tapped again (auto toggles the boolean) |

- **Nested view model** `iconVM`

| ## properties | ## description                                                                                                              |
| ------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `iconType`    | enum for icon selection* `heart` for the "like" heart shape (selected by default)<br>* `star` for the "favorite" star shape |
