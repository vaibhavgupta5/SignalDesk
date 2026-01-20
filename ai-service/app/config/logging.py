import logging


def configure_logging():
    logging.basicConfig(
        level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s"
    )


__all__ = ["configure_logging"]
