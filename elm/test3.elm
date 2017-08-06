import Html exposing (..)
import Html.Events exposing (..)
import Random
import Svg exposing (svg, polygon, rect)
import Svg.Attributes exposing (..)

main =
  Html.program
    { init = init
    , view = view
    , update = update
    , subscriptions = subscriptions
    }

-- MODEL

type alias Model =
  { desktops: List DesktopWidget
  }

type alias Rect =
  { x: Int, y: Int, w: Int, h: Int }

type alias DesktopWidget =
  { name: String
  , parentId: Maybe Int
  , layout: String
  , rc: Rect
  , childIdOrder: List Int
  , childIdChain: List Int
  }

init : (Model, Cmd Msg)
init =
  let
    desktops =
      [ DesktopWidget "web" Nothing "tile-right" (Rect 0 25 1920 1055) [] []
      ]
  in
    (Model desktops, Cmd.none)

-- UPDATE

type Msg =
  AddDesktop

update : Msg -> Model -> (Model, Cmd Msg)
update msg model =
  case msg of
  AddDesktop ->
    (model, Cmd.none)


-- SUBSCRIPTIONS

subscriptions : Model -> Sub Msg
subscriptions model =
  Sub.none

-- VIEW

view : Model -> Html Msg
view model =
  div []
  (List.concat
    [ [ h1 [] [ text (toString (List.length model.desktops)) ]
      , button [ onClick AddDesktop ] [ text "Add Desktop" ]
      ]
    , [makeSvgViewH model]
    ]
  )

-- Display desktops horizontally
makeSvgViewH : Model -> Html Msg
makeSvgViewH model =
    svg
      [ version "1.1", x "0", y "0", viewBox "0 0 2000 2000", style "width: 15em" ]
      (List.concat (List.map makeSvgDesktop model.desktops))

makeSvgDesktop : DesktopWidget -> List (Svg.Svg Msg)
makeSvgDesktop desktop =
    [ rect [fill "blue", width (toString desktop.rc.w), height (toString desktop.rc.h)] []
    -- x="0" y="35" font-family="Verdana" font-size="35"
    , Svg.text_ [y (toString (desktop.rc.h // 2)), stroke "white", fill "black", fontSize "200", strokeWidth "4"] [Svg.text desktop.name]
    ]
