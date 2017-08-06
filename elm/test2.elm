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
  { desktopCount : Int
  }

init : (Model, Cmd Msg)
init =
  (Model 4, Cmd.none)

-- UPDATE

type Msg =
  AddDesktop

update : Msg -> Model -> (Model, Cmd Msg)
update msg model =
  case msg of
  AddDesktop ->
  ({ model | desktopCount = model.desktopCount + 1}, Cmd.none)


-- SUBSCRIPTIONS

subscriptions : Model -> Sub Msg
subscriptions model =
  Sub.none

-- VIEW

view : Model -> Html Msg
view model =
  div []
  (List.concat
  [ [ h1 [] [ text (toString model.desktopCount) ]
  , button [ onClick AddDesktop ] [ text "Add Desktop" ]
  ]
  , makeDesktops model
  ]
  )

makeDesktops : Model -> List (Html Msg)
makeDesktops model =
  List.repeat
    model.desktopCount
    (svg
      [ version "1.1", x "0", y "0", viewBox "0 0 600 400", style "width: 15em; float: left"
      ]
      [ polygon [ fill "#F0AD00", points "161.649,152.782 231.514,82.916 91.783,82.916" ] []
      , polygon [ fill "#7FD13B", points "8.867,0 79.241,70.375 232.213,70.375 161.838,0" ] []
      , rect [width "600", height "400"] []
      ]
    )
