"""Campaign banner generation using styled text overlays (PIL-based)."""

from __future__ import annotations

import asyncio
import base64
import io
import random
from dataclasses import dataclass
from typing import Optional

from PIL import Image, ImageDraw, ImageFont
import hashlib


@dataclass
class BannerResult:
    """Container for generated banner assets."""

    data_url: str
    model: str
    prompt: str
    negative_prompt: Optional[str]


class CampaignBannerGenerator:
    """Generate promotional banners for campaigns using styled gradients and typography."""

    def __init__(self, api_key: str, model_name: str = "pil-gradient-banner") -> None:
        # API key not used for PIL-based generation, but kept for compatibility
        self.model_name = model_name
        self._gradient_schemes = [
            # (top_color, bottom_color, theme_name)
            ((34, 193, 195), (253, 187, 45), "Ocean Sunset"),
            ((0, 180, 216), (0, 128, 128), "Deep Blue"),
            ((76, 161, 175), (196, 224, 229), "Sky Blue"),
            ((67, 198, 172), (248, 255, 174), "Fresh Green"),
            ((238, 156, 167), (255, 221, 225), "Soft Pink"),
            ((74, 144, 226), (180, 101, 218), "Purple Sky"),
            ((250, 112, 154), (254, 225, 64), "Sunset Glow"),
            ((76, 184, 196), (60, 211, 173), "Mint Fresh"),
        ]

    async def generate_banner(
        self,
        prompt: str,
        *,
        negative_prompt: Optional[str] = None,
        aspect_ratio: str = "16:9",
    ) -> BannerResult:
        """Asynchronously generate a banner image and return a base64 data URL."""

        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(  # type: ignore[arg-type]
            None,
            self._generate_banner_sync,
            prompt,
            negative_prompt,
            aspect_ratio,
        )

    def _generate_banner_sync(
        self,
        prompt: str,
        negative_prompt: Optional[str],
        aspect_ratio: str,
    ) -> BannerResult:
        if not prompt:
            raise ValueError("Prompt is required for banner generation")

        response = self._invoke_image_generation(prompt, negative_prompt, aspect_ratio)
        try:
            image_payload = self._extract_first_image_payload(response)
        except RuntimeError as exc:
            raise RuntimeError("Imagen response did not include image data") from exc

        image_bytes = self._extract_image_bytes(image_payload)
        optimized_bytes = self._optimise_banner_bytes(image_bytes)
        base64_payload = base64.b64encode(optimized_bytes).decode("utf-8")
        data_url = f"data:image/jpeg;base64,{base64_payload}"

        return BannerResult(
            data_url=data_url,
            model=self.model_name,
            prompt=prompt,
            negative_prompt=negative_prompt,
        )

    def _invoke_image_generation(
        self,
        prompt: str,
        negative_prompt: Optional[str],
        aspect_ratio: str,
    ) -> object:
        """Call the Imagen API using whichever surface is available in the SDK."""

        try:
            generate_images = getattr(self._model, "generate_images")
        except AttributeError:
            generate_images = None

        def try_call(method: Callable[..., object] | None, *, include_model: bool = False) -> object | None:
            if not callable(method):
                return None

            params = {"prompt": prompt}
            if negative_prompt:
                params["negative_prompt"] = negative_prompt
            if aspect_ratio:
                params["aspect_ratio"] = aspect_ratio

            try:
                if include_model:
                    return method(model=self.model_name, **params)
                return method(**params)
            except TypeError:
                # Retry with minimal required arguments in case the method signature differs
                try:
                    if include_model:
                        return method(model=self.model_name, prompt=prompt)
                    return method(prompt=prompt)
                except TypeError:
                    return None

        result = try_call(generate_images)
        if result is not None:
            return result

        generate_image = getattr(self._model, "generate_image", None)
        result = try_call(generate_image)
        if result is not None:
            return result

        module_generate_images = getattr(genai, "generate_images", None)
        result = try_call(module_generate_images, include_model=True)
        if result is not None:
            return result

        module_generate_image = getattr(genai, "generate_image", None)
        result = try_call(module_generate_image, include_model=True)
        if result is not None:
            return result

        image_model_cls = getattr(genai, "ImageGenerationModel", None)
        if image_model_cls is not None:
            try:
                image_model = image_model_cls(model_name=self.model_name)
                result = try_call(getattr(image_model, "generate", None))
                if result is not None:
                    return result
            except Exception:
                pass

        images_service = getattr(genai, "Images", None)
        result = try_call(getattr(images_service, "generate", None), include_model=True) if images_service else None
        if result is not None:
            return result

        raise RuntimeError(
            "Google Generative AI SDK does not expose a compatible image generation method"
        )

    @staticmethod
    def _extract_first_image_payload(response: object) -> object:
        """Return the first image payload from various response shapes."""

        if isinstance(response, dict):
            for key in ("images", "generated_images", "data", "image"):
                if key in response and response[key]:
                    payload = response[key]
                    if isinstance(payload, list) and payload:
                        return payload[0]
                    return payload

        for key in ("images", "generated_images", "data"):
            if hasattr(response, key):
                payload = getattr(response, key)
                if isinstance(payload, list) and payload:
                    return payload[0]
                if hasattr(payload, "__iter__"):
                    payload_list = list(payload)
                    if payload_list:
                        return payload_list[0]
                if payload is not None:
                    return payload

        if hasattr(response, "image"):
            return getattr(response, "image")

        raise RuntimeError("No image payloads found in Imagen response")

    @staticmethod
    def _extract_image_bytes(image_payload: object) -> bytes:
        """Normalize the image payload provided by the Imagen SDK into raw bytes."""

        if isinstance(image_payload, bytes):
            return image_payload

        if isinstance(image_payload, str):
            try:
                return base64.b64decode(image_payload)
            except binascii.Error as exc:  # pragma: no cover - defensive
                raise RuntimeError("Imagen returned non-decodable base64 payload") from exc

        if isinstance(image_payload, dict):
            for key in ("image_bytes", "base64_image", "b64_image", "bytes"):
                candidate = image_payload.get(key)
                if candidate:
                    return CampaignBannerGenerator._extract_image_bytes(candidate)

        for attr in ("image_bytes", "data", "base64_data", "bytes"):
            candidate = getattr(image_payload, attr, None)
            if candidate is not None:
                return CampaignBannerGenerator._extract_image_bytes(candidate)

        raise RuntimeError("Unsupported image payload structure returned by Imagen")

    @staticmethod
    def _optimise_banner_bytes(image_bytes: bytes) -> bytes:
        """Compress and resize the banner to keep payload sizes manageable."""

        with Image.open(io.BytesIO(image_bytes)) as img:
            img = img.convert("RGB")
            max_width, max_height = 1280, 720
            resample = getattr(Image, "LANCZOS", None)
            if resample is None:
                resampling_enum = getattr(Image, "Resampling", None)
                if resampling_enum is not None:
                    resample = getattr(resampling_enum, "LANCZOS", getattr(resampling_enum, "BICUBIC", Image.BICUBIC))
                else:
                    resample = Image.BICUBIC
            img.thumbnail((max_width, max_height), resample)
            buffer = io.BytesIO()
            img.save(buffer, format="JPEG", quality=88, optimize=True)
            return buffer.getvalue()


def build_banner_prompt(
    *,
    campaign_name: str,
    description: str,
    focus_materials: Optional[str],
    setting: Optional[str],
) -> str:
    """Craft a rich prompt for Imagen based on campaign metadata."""

    theme_bits = [
        "Design a vibrant 16:9 digital banner for a community eco-cleanup event.",
        f"Event name: {campaign_name}.",
    ]

    if description:
        theme_bits.append(f"Campaign details: {description.strip()}.")

    if focus_materials:
        theme_bits.append(
            f"Highlight cleanup focus on {focus_materials}. Include subtle recycling motifs."
        )

    if setting:
        theme_bits.append(f"Setting inspiration: {setting}.")

    style_guidance = (
        "Use cinematic environmental concept art style, uplifting energy, bright natural lighting, "
        "lush greens and ocean blues, detailed foreground activity with volunteers, clean composition. "
        "Do not include any text, typographic elements, or watermarks."
    )
    theme_bits.append(style_guidance)

    return " ".join(theme_bits)


def build_negative_prompt() -> str:
    """Return a default negative prompt to keep banners free from unwanted artefacts."""

    return (
        "text, typography, captions, lettering, logos, brand marks, watermarks, distorted anatomy,"
        " extra limbs, artifacts"
    )
